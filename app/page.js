"use client";

import { useEffect, useRef } from 'react';

export default function HomePage() {
  const canvasRef = useRef(null);

  useEffect(() => {
    // Particle Animation
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 2 + 1;
        this.color = `rgba(239, 68, 68, ${Math.random() * 0.3 + 0.1})`; // Red theme
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
      }

      draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const initParticles = () => {
      particles = [];
      const particleCount = Math.min(window.innerWidth / 10, 100); // Responsive count
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      // Draw connections
      particles.forEach((p1, i) => {
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            ctx.strokeStyle = `rgba(239, 68, 68, ${0.1 * (1 - distance / 150)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    initParticles();
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  useEffect(() => {
    // Scroll Reveal Animation
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        } else {
          entry.target.classList.remove('active');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: -1,
          pointerEvents: 'none'
        }}
      />

      {/* Navbar */}
      <nav className="navbar">
        <div className="container nav-container">
          <div className="logo">
            <span className="logo-icon"></span>
            SOS Alert
          </div>

          <div className="nav-actions">
            <a href="/login" className="nav-link">เข้าสู่ระบบ</a>
            <a href="/register" className="btn btn-primary">ลงทะเบียน</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="container hero-container">
          <div className="hero-content reveal">
            <span className="badge">ระบบแจ้งเหตุฉุกเฉิน 24 ชม.</span>
            <h1 className="hero-title">
              ความช่วยเหลือ<br />
              <span className="text-gradient">ส่งถึงคุณทันที</span>
            </h1>
            <p className="hero-subtitle"> ระบบแจ้งเหตุฉุกเฉินอัจฉริยะ ส่งพิกัดแม่นยำ ติดตามสถานะได้เรียลไทม์ เชื่อมต่อหน่วยกู้ภัยที่ใกล้ที่สุด</p>
            <div className="hero-actions">
              <a href="/register" className="btn btn-primary btn-lg">แจ้งเหตุฉุกเฉิน</a>
              <a href="#features" className="btn btn-outline btn-lg">ดูการทำงาน</a>
            </div>

            <div className="hero-stats reveal">
              <div className="stat-item">
                <span className="stat-value">24/7</span>
                <span className="stat-label">พร้อมใช้งาน</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-value">100%</span>
                <span className="stat-label">ความปลอดภัยของข้อมูลผู้ใช้</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-value">100%</span>
                <span className="stat-label">ครอบคลุมพื้นที่</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="features">
        <div className="container">
          <div className="section-header reveal">
            <span className="section-tag">ฟีเจอร์หลัก</span>
            <h2 className="section-title">เทคโนโลยีเพื่อชีวิต</h2>
            <p className="section-desc">เราใช้เทคโนโลยีล่าสุดเพื่อให้มั่นใจว่าทุกการขอความช่วยเหลือจะได้รับการตอบสนองอย่างรวดเร็วที่สุด</p>
          </div>

          <div className="feature-grid">
            <div className="feature-card reveal">
              <div className="feature-icon">📍</div>
              <h3>Smart GPS Tracking</h3>
              <p>ระบุพิกัดตำแหน่งของคุณอัตโนมัติด้วยความแม่นยำสูง ส่งตรงถึงเจ้าหน้าที่ทันทีที่กดขอความช่วยเหลือ</p>
            </div>
            <div className="feature-card reveal">
              <div className="feature-icon">⚡</div>
              <h3>Real-time Alerts</h3>
              <p>ระบบแจ้งเตือนภัยพิบัติและเหตุฉุกเฉินในพื้นที่ของคุณล่วงหน้า เพื่อการเตรียมตัวที่ทันท่วงที</p>
            </div>
            <div className="feature-card reveal">
              <div className="feature-icon">🛡️</div>
              <h3>Secure Connection</h3>
              <p>ข้อมูลส่วนตัวและข้อมูลสุขภาพของคุณจะถูกเข้ารหัสและส่งให้เฉพาะเจ้าหน้าที่ที่เกี่ยวข้องเท่านั้น</p>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="about">
        <div className="container">
          <div className="about-content reveal">
            <h2>เกี่ยวกับ SOS Alert</h2>
            <p>
              SOS Alert คือแพลตฟอร์มต้นแบบสำหรับการแจ้งเหตุฉุกเฉินที่พัฒนาขึ้นเพื่อสาธิตการทำงานของระบบกู้ภัยยุคใหม่
              ที่เน้นความรวดเร็ว แม่นยำ และใช้งานง่ายสำหรับทุกคน
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container footer-container">
          <p>© 2026 SOS Alert Project. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
