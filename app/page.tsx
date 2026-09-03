import Link from "next/link";
import { scenarios, categoryLabels } from "@/lib/scenarios";
import { Category } from "@/lib/types";

const order: Category[] = ["team", "clients", "stakeholders", "freelance"];

export default function HomePage() {
  return (
    <div className="container">
      <h1 className="page-title">Тренажер комунікації для менеджерів</h1>
      <p className="page-subtitle">
        Оберіть ситуацію — і потренуйтеся вести складну розмову з ШІ-співрозмовником. Наприкінці
        отримаєте детальний розбір і оцінку за 6 критеріями.
      </p>

      {order.map((cat) => (
        <div key={cat}>
          <div className="category-heading">{categoryLabels[cat]}</div>
          <div className="card-grid">
            {scenarios
              .filter((s) => s.category === cat)
              .map((s) => (
                <Link key={s.id} href={`/scenario/${s.id}`} className="scenario-card">
                  <p className="scenario-card-title">{s.titleUa}</p>
                  <p className="scenario-card-short">{s.shortUa}</p>
                </Link>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
