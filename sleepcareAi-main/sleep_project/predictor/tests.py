import json
from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.urls import reverse
from predictor.models import SleepQualityPrediction, SleepDisorderPrediction


class AuthenticationTests(TestCase):
    def setUp(self):
        self.client = Client(enforce_csrf_checks=False)
        self.user = User.objects.create_user(
            username='tony',
            email='tony@example.com',
            password='TestPassword123!'
        )

    def test_csrf_endpoint(self):
        response = self.client.get(reverse('predictor:api_csrf'))
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('csrfToken', data)

    def test_me_unauthenticated(self):
        response = self.client.get(reverse('predictor:api_me'))
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertFalse(data.get('authenticated'))

    def test_login_successful(self):
        payload = {
            'username': 'tony',
            'password': 'TestPassword123!'
        }
        response = self.client.post(
            reverse('predictor:api_login'),
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get('authenticated'))
        self.assertEqual(data.get('user', {}).get('username'), 'tony')

        # Verify session is now active
        me_response = self.client.get(reverse('predictor:api_me'))
        self.assertTrue(me_response.json().get('authenticated'))

    def test_login_failed_invalid_credentials(self):
        payload = {
            'username': 'tony',
            'password': 'WrongPassword999'
        }
        response = self.client.post(
            reverse('predictor:api_login'),
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertFalse(data.get('authenticated'))
        self.assertEqual(data.get('error'), 'Invalid username or password.')

    def test_register_successful(self):
        payload = {
            'username': 'alice',
            'email': 'alice@example.com',
            'password': 'SecureAlicePass123!',
            'password_confirm': 'SecureAlicePass123!',
            'privacy_consent': True
        }
        response = self.client.post(
            reverse('predictor:api_register'),
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertTrue(data.get('authenticated'))
        self.assertEqual(data.get('user', {}).get('username'), 'alice')
        self.assertTrue(User.objects.filter(username='alice').exists())

    def test_register_duplicate_username(self):
        payload = {
            'username': 'tony',
            'email': 'another@example.com',
            'password': 'SecureAlicePass123!',
            'password_confirm': 'SecureAlicePass123!'
        }
        response = self.client.post(
            reverse('predictor:api_register'),
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertFalse(data.get('authenticated'))
        self.assertIn('already exists', data.get('error', '').lower())

    def test_register_password_mismatch(self):
        payload = {
            'username': 'bob',
            'email': 'bob@example.com',
            'password': 'Password123!',
            'password_confirm': 'PasswordMismatch456!'
        }
        response = self.client.post(
            reverse('predictor:api_register'),
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertFalse(data.get('authenticated'))

    def test_logout(self):
        self.client.login(username='tony', password='TestPassword123!')
        response = self.client.post(reverse('predictor:api_logout'))
        self.assertEqual(response.status_code, 200)

        # Confirm session is terminated
        me_response = self.client.get(reverse('predictor:api_me'))
        self.assertFalse(me_response.json().get('authenticated'))

    def test_prediction_protection_unauthenticated(self):
        response = self.client.post(
            reverse('predictor:api_sleep_quality'),
            data=json.dumps({}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 401)

        response2 = self.client.post(
            reverse('predictor:api_sleep_disorder'),
            data=json.dumps({}),
            content_type='application/json'
        )
        self.assertEqual(response2.status_code, 401)

    def test_dashboard_unauthenticated(self):
        response = self.client.get(reverse('predictor:api_dashboard'))
        self.assertEqual(response.status_code, 401)

    def test_dashboard_empty_user(self):
        self.client.login(username='tony', password='TestPassword123!')
        response = self.client.get(reverse('predictor:api_dashboard'))
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get('user', {}).get('username'), 'tony')
        self.assertIsNone(data.get('stats'))
        self.assertEqual(data.get('recent_analyses'), [])
        self.assertEqual(data.get('sleep_quality_trend'), [])

    def test_dashboard_with_analyses(self):
        self.client.login(username='tony', password='TestPassword123!')
        SleepQualityPrediction.objects.create(
            user=self.user,
            predicted_quality=7.8,
            quality_label='Good',
            sleep_duration=7.5,
            stress_level=4,
            physical_activity=45,
        )
        SleepDisorderPrediction.objects.create(
            user=self.user,
            predicted_disorder='No Sleep Disorder',
            probabilities={'No Sleep Disorder': 0.72, 'Insomnia': 0.18, 'Sleep Apnea': 0.10},
            sleep_duration=7.0,
            stress_level=4,
            physical_activity=50,
        )

        response = self.client.get(reverse('predictor:api_dashboard'))
        self.assertEqual(response.status_code, 200)
        data = response.json()
        stats = data.get('stats')
        self.assertIsNotNone(stats)
        self.assertEqual(stats.get('total_analyses'), 2)
        self.assertEqual(stats.get('latest_sleep_score'), 7.8)
        self.assertEqual(stats.get('latest_quality_label'), 'Good')
        self.assertEqual(len(data.get('recent_analyses')), 2)
        self.assertEqual(len(data.get('sleep_quality_trend')), 1)


class SleepGoalTests(TestCase):
    def setUp(self):
        self.client_a = Client(enforce_csrf_checks=False)
        self.client_b = Client(enforce_csrf_checks=False)

        self.user_a = User.objects.create_user(
            username='user_alice',
            email='alice@example.com',
            password='AlicePassword123!'
        )
        self.user_b = User.objects.create_user(
            username='user_bob',
            email='bob@example.com',
            password='BobPassword123!'
        )

    def test_unauthenticated_access_rejected(self):
        client = Client(enforce_csrf_checks=False)
        res = client.get(reverse('predictor:api_get_active_sleep_goal'))
        self.assertEqual(res.status_code, 401)

        res_post = client.post(
            reverse('predictor:api_create_sleep_goal'),
            data=json.dumps({'target_sleep_duration': 480}),
            content_type='application/json'
        )
        self.assertEqual(res_post.status_code, 401)

    def test_new_user_sees_no_goal(self):
        self.client_a.login(username='user_alice', password='AlicePassword123!')
        res = self.client_a.get(reverse('predictor:api_get_active_sleep_goal'))
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIsNone(data.get('goal'))
        self.assertEqual(data.get('records'), [])

    def test_multi_user_goal_and_record_isolation(self):
        # 1. Alice logs in and sets a 480m (8h) goal
        self.client_a.login(username='user_alice', password='AlicePassword123!')
        create_res_a = self.client_a.post(
            reverse('predictor:api_create_sleep_goal'),
            data=json.dumps({
                'target_sleep_duration': 480,
                'target_bedtime': '10:30 PM',
                'target_wake_time': '6:30 AM',
                'goal_type': 'both'
            }),
            content_type='application/json'
        )
        self.assertEqual(create_res_a.status_code, 201)
        data_a = create_res_a.json()
        goal_a_id = data_a['goal']['id']
        self.assertEqual(data_a['goal']['target_sleep_duration'], 480)
        self.assertEqual(len(data_a['records']), 21)

        # Alice records Day 1 (500m - achieved) and Day 2 (400m - missed)
        rec_res_1 = self.client_a.post(
            reverse('predictor:api_record_daily_sleep', kwargs={'goal_id': goal_a_id}),
            data=json.dumps({
                'day_number': 1,
                'actual_sleep_duration': 500,
                'bedtime': '10:15 PM',
                'wake_time': '6:35 AM'
            }),
            content_type='application/json'
        )
        self.assertEqual(rec_res_1.status_code, 200)
        self.assertTrue(rec_res_1.json()['record']['goal_achieved'])

        rec_res_2 = self.client_a.post(
            reverse('predictor:api_record_daily_sleep', kwargs={'goal_id': goal_a_id}),
            data=json.dumps({
                'day_number': 2,
                'actual_sleep_duration': 400,
                'bedtime': '11:30 PM',
                'wake_time': '6:10 AM'
            }),
            content_type='application/json'
        )
        self.assertEqual(rec_res_2.status_code, 200)
        self.assertFalse(rec_res_2.json()['record']['goal_achieved'])
        # Alice stats: 2 recorded, 1 achieved, 50% success
        alice_stats = rec_res_2.json()['stats']
        self.assertEqual(alice_stats['recordedDaysCount'], 2)
        self.assertEqual(alice_stats['achievedDaysCount'], 1)
        self.assertEqual(alice_stats['successRate'], 50)

        # 2. Bob logs in. Bob MUST see NO goal initially!
        self.client_b.login(username='user_bob', password='BobPassword123!')
        bob_init_res = self.client_b.get(reverse('predictor:api_get_active_sleep_goal'))
        self.assertEqual(bob_init_res.status_code, 200)
        self.assertIsNone(bob_init_res.json().get('goal'))
        self.assertEqual(bob_init_res.json().get('records'), [])

        # Bob attempts to modify Alice's goal - must be blocked (404/not allowed)
        tamper_res = self.client_b.post(
            reverse('predictor:api_record_daily_sleep', kwargs={'goal_id': goal_a_id}),
            data=json.dumps({'day_number': 1, 'actual_sleep_duration': 600}),
            content_type='application/json'
        )
        self.assertEqual(tamper_res.status_code, 404)

        # Bob creates his own 510m (8.5h) goal
        create_res_b = self.client_b.post(
            reverse('predictor:api_create_sleep_goal'),
            data=json.dumps({
                'target_sleep_duration': 510,
                'target_bedtime': '10:00 PM',
                'target_wake_time': '6:30 AM',
                'goal_type': 'sleep_duration'
            }),
            content_type='application/json'
        )
        self.assertEqual(create_res_b.status_code, 201)
        goal_b_id = create_res_b.json()['goal']['id']
        self.assertNotEqual(goal_a_id, goal_b_id)

        # Bob records Day 1 (520m - achieved)
        bob_rec_1 = self.client_b.post(
            reverse('predictor:api_record_daily_sleep', kwargs={'goal_id': goal_b_id}),
            data=json.dumps({'day_number': 1, 'actual_sleep_duration': 520}),
            content_type='application/json'
        )
        self.assertEqual(bob_rec_1.status_code, 200)
        self.assertTrue(bob_rec_1.json()['record']['goal_achieved'])
        self.assertEqual(bob_rec_1.json()['stats']['successRate'], 100)
        self.assertEqual(bob_rec_1.json()['stats']['currentStreak'], 1)

        # 3. Check Alice's active goal again - completely untouched
        alice_check = self.client_a.get(reverse('predictor:api_get_active_sleep_goal'))
        alice_data = alice_check.json()
        self.assertEqual(alice_data['goal']['id'], goal_a_id)
        self.assertEqual(alice_data['goal']['target_sleep_duration'], 480)
        self.assertEqual(alice_data['stats']['recordedDaysCount'], 2)
        self.assertEqual(alice_data['stats']['successRate'], 50)


