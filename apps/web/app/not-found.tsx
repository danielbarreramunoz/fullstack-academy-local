import Link from "next/link";
import { IconArrowLeft, IconSearch } from "../components/icons";

export default function NotFound() {
  return (
    <div className="card card-pad" style={{ maxWidth: 560, margin: "48px auto", textAlign: "center" }}>
      <span className="empty-icon" style={{ margin: "0 auto 14px" }}>
        <IconSearch size={20} />
      </span>
      <span className="eyebrow">Error 404</span>
      <h1 style={{ fontSize: "1.75rem", margin: "10px 0" }}>Esta página no existe</h1>
      <p className="lead" style={{ margin: "0 auto 22px" }}>
        La ruta que buscas no está en el plan. Vuelve al dashboard para retomar tu sesión.
      </p>
      <Link href="/" className="btn btn-primary">
        <IconArrowLeft size={15} />
        Volver al dashboard
      </Link>
    </div>
  );
}
