export interface MetricaComVariacao {
  valor: number;
  variacao: number;
}

export interface DashboardEstudanteSummary {
  mediaGeral: MetricaComVariacao;
  frequencia: MetricaComVariacao;
  categorias: Record<string, MetricaComVariacao>;
}

export interface HistoricoDataset {
  label: string;
  data: number[];
}

export interface AnalyticsHistorico {
  labels: string[];
  datasets: HistoricoDataset[];
}
