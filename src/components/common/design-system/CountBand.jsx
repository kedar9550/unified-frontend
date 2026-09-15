
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

export const CountBand = ({ items = [], total = null }) => {
  if (!items || items.length === 0) return null;

  return (
    <>
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="countband-primary-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" className="gradient-start-stop" />
            <stop offset="50%" className="gradient-mid-stop" />
            <stop offset="100%" className="gradient-end-stop" />
          </linearGradient>
        </defs>
      </svg>
      <div className="count-band-wrapper">
        {items.map((item, index) => {
          return (
            <div
              key={item.id}
              className={`count-band-segment segment-${item.color}`}
              style={{ zIndex: items.length - index + 2 }}
            >
              <div className="segment-icon-wrapper">
                {item.icon}
              </div>
              <div className="segment-text-wrapper">
                <span className="segment-title">{item.title}</span>
                <span className="segment-value">{item.value}</span>
              </div>
              <div className="segment-chevron">
                <ChevronRightIcon sx={{ fontSize: 16 }} />
              </div>
            </div>
          );
        })}

        {total && (
          <div className="count-band-total" style={{ zIndex: 1 }}>
            <div className="total-divider" />
            <div className="total-text-wrapper">
              <span className="total-title">{total.title}</span>
              <span className="total-value">{total.value}</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CountBand;
