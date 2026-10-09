import './Footer.css'

function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <span className="footer-logo">StudentNest</span>
          <p>Helping students in Bauchi find accommodation without wasting days searching.</p>
        </div>

        <div className="footer-col">
          <h4>Navigate</h4>
          <ul>
            <li><a href="#home">Home</a></li>
            <li><a href="#accommodation">Find Accommodation</a></li>
            <li><a href="#roommates">Roommates</a></li>
            <li><a href="#how-it-works">How It Works</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Contact</h4>
          <ul>
            <li>hello@studentnest.ng</li>
            <li>+234 800 000 0000</li>
            <li>Bauchi, Nigeria</li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Follow</h4>
          <ul className="footer-social">
            <li><a href="#instagram">Instagram</a></li>
            <li><a href="#x">X</a></li>
            <li><a href="#whatsapp">WhatsApp</a></li>
          </ul>
        </div>
      </div>

      <div className="container footer-bottom">
        <p>© {year} StudentNest. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default Footer
