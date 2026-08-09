function Marchio({ compatto = false }) {
  return (
    <div
      className={compatto ? 'marchio marchio-compatto' : 'marchio'}
      aria-label="Race Analysis Hub"
    >
      <span>Race</span>
      <i>Analysis</i>
      <strong>Hub</strong>
    </div>
  )
}

export default Marchio
