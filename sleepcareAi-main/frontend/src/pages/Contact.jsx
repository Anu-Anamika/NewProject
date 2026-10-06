import React from 'react';
import Footer from '../components/Footer';
import { Mail, MapPin, Phone, MessageSquare } from 'lucide-react';

export default function Contact() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <section style={{ maxWidth: '900px', margin: '0 auto', padding: '3.5rem 5% 5rem', width: '100%' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <div className="sc-dash-card-tag">
            <MessageSquare size={14} />
            <span>GET IN TOUCH</span>
          </div>
          <h1 className="sc-dash-section-title" style={{ fontSize: '2.2rem' }}>
            Contact & Support
          </h1>
          <p className="sc-dash-section-subtitle" style={{ fontSize: '1.05rem', lineHeight: 1.6 }}>
            Have questions about SleepCare AI research, methodology, or technical implementation?
            Feel free to reach out to our team.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '18px',
              border: '1px solid #DCE8F5',
              padding: '1.75rem',
              boxShadow: '0 4px 16px rgba(16, 37, 74, 0.04)',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: '#EBF5FF',
                color: '#147DF5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <Mail size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#071D3B', marginBottom: '0.35rem' }}>Email Us</h3>
            <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              For research and general inquiries:
            </p>
            <a href="mailto:support@sleepcareai.internal" style={{ color: '#147DF5', fontWeight: 600, fontSize: '0.92rem' }}>
              support@sleepcareai.internal
            </a>
          </div>

          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '18px',
              border: '1px solid #DCE8F5',
              padding: '1.75rem',
              boxShadow: '0 4px 16px rgba(16, 37, 74, 0.04)',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: '#F0FDF4',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <MapPin size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#071D3B', marginBottom: '0.35rem' }}>Academic Research</h3>
            <p style={{ color: '#64748B', fontSize: '0.9rem' }}>
              MSc Data Science Project<br />
              School of Computing & Mathematical Sciences
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
