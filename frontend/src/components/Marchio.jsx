function Marchio({ compatto = false }) {
  return (
    <div
      className={compatto ? 'marchio marchio-compatto' : 'marchio'}
      aria-label="Race Analysis Hub feat GPK"
    >
      <span className="marchio-nome">
        <span>Race</span>
        <span>Analysis</span>
        <strong>Hub</strong>
      </span>
      <span className="marchio-collaborazione">
        <small>feat</small>
        <strong>GPK</strong>
      </span>
    </div>
  )
}

export default Marchio
