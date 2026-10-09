import './HowItWorks.css'

const STEPS = [
  {
    number: '01',
    title: 'Search',
    description: 'Find accommodation based on your budget, location and room type.',
  },
  {
    number: '02',
    title: 'Compare',
    description: 'View important details — prices, locations and available facilities — side by side.',
  },
  {
    number: '03',
    title: 'Connect',
    description: 'Reach out directly to the agent, landlord or property manager to secure it.',
  },
]

function HowItWorks() {
  return (
    <section id="how-it-works" className="how">
      <div className="container">
        <p className="eyebrow" style={{ color: '#c9d3ea' }}>How it works</p>
        <h2 className="how-heading">Three steps between you and a place to stay.</h2>

        <ol className="how-steps">
          {STEPS.map((step, index) => (
            <li className="how-step" key={step.number}>
              <span className="how-step-number">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
              {index < STEPS.length - 1 && <span className="how-step-connector" aria-hidden="true" />}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export default HowItWorks
