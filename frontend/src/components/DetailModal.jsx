import Modal from './Modal.jsx'

export default function DetailModal({ item, onClose, onLaunch }) {
  return (
    <Modal title={item.name} onClose={onClose} wide>
      <div className="detail">
        <img src={item.icon || item.art} alt={item.name} />
        <div>
          {item.description ? (
            <>
              <p className="muted">
                {item.developer} · {item.genre}
                {item.price && item.price !== 'Free' ? ' · ' + item.price : ''}
              </p>
              <p className="muted">
                ★ {item.rating ? item.rating.toFixed(1) : '—'}
                {item.ratings ? ` (${item.ratings.toLocaleString()} ratings)` : ''}
              </p>
              <p>{item.description}</p>
            </>
          ) : (
            <p className="muted">
              {item.kind === 'store' ? 'From the Fusion Store.' : 'Imported application.'} Launching is simulated in this web preview.
            </p>
          )}
          <button className="btn btn-primary" onClick={() => onLaunch(item.name)}>Launch</button>
        </div>
      </div>
    </Modal>
  )
}
