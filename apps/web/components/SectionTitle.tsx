interface Props {
  children: React.ReactNode;
  center?: boolean;
  id?: string;
  /** Kiểu trang con (DichVu): eyebrow cam + H2 thường, không gạch. */
  eyebrow?: string;
}

export function SectionTitle({ children, center, id, eyebrow }: Props) {
  if (eyebrow) {
    return (
      <div className="sec-head-plain">
        <div className="eyebrow">{eyebrow}</div>
        <h2 id={id} className="h2">
          {children}
        </h2>
      </div>
    );
  }
  return (
    <div className={center ? 'sec-head sec-head--center' : 'sec-head'}>
      <h2 id={id} className="h2-upper">
        {children}
      </h2>
      <span className="sec-bar" aria-hidden="true" />
    </div>
  );
}
