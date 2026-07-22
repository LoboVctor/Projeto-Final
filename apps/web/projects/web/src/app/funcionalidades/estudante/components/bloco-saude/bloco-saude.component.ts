import {
  Component,
  OnInit,
  inject,
  ChangeDetectionStrategy,
  input,
  output,
  signal } from '@angular/core';
import { DatePipe, LowerCasePipe } from '@angular/common';
import {
  EstudantesService,
  EstudanteSaude,
  EspecificidadeSaude } from '../../../../compartilhado/services/estudantes.service';
import { ModalEspecificidadesComponent } from './modais/restricoes-modal.component';
import { ModalMedicamentosComponent } from './modais/medicamentos-modal.component';
import { ModalLaudosComponent } from './modais/laudos-modal.component';
import { DiagFullNamePipe } from '../../../../compartilhado/pipes/student.pipes';
import { DiagnosticoVisibilidadeService } from '../../../../compartilhado/services/diagnostico-visibilidade.service';

@Component({
  selector: 'app-bloco-saude',
  imports: [DatePipe, LowerCasePipe, DiagFullNamePipe, ModalEspecificidadesComponent, ModalMedicamentosComponent, ModalLaudosComponent],
  templateUrl: './bloco-saude.component.html',
  styleUrls: ['./bloco-saude.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush })
export class BlocoSaudeComponent implements OnInit {
  protected readonly diagVis = inject(DiagnosticoVisibilidadeService);

  readonly estudanteId = input.required<string>();
  readonly recolher = output<void>();
  readonly dadosAtualizados = output<void>();

  dadosSaude = signal<EstudanteSaude | null>(null);
  restricoes = signal<EspecificidadeSaude[]>([]);
  especificidadesAlimentares = signal<EspecificidadeSaude[]>([]);
  outrasEspecificidades = signal<EspecificidadeSaude[]>([]);

  isLoading = signal(false);
  isModalEspecificidadesOpen = signal(false);
  isModalMedicamentosOpen = signal(false);
  isModalLaudosOpen = signal(false);

  private estudantesService = inject(EstudantesService);

  ngOnInit(): void {
    if (this.estudanteId()) {
      this.carregarDadosSaude();
    }
  }

  carregarDadosSaude(): void {
    this.isLoading.set(true);
    this.estudantesService.getSaude(this.estudanteId()).subscribe({
      next: (dados) => {
        this.dadosSaude.set(dados);

        const restricoes = dados.especificidades.filter((e) => e.tipo === 'RESTRICAO');
        this.restricoes.set(restricoes);

        this.especificidadesAlimentares.set(
          restricoes.filter((e) => e.categoria === 'ALIMENTAR'),
        );
        this.outrasEspecificidades.set(
          restricoes.filter((e) => e.categoria !== 'ALIMENTAR'),
        );

        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      } });
  }

  onRecolher(): void {
    this.recolher.emit();
  }


  abrirModalEspecificidades(): void {
    this.isModalEspecificidadesOpen.set(true);
  }

  fecharModalEspecificidades(): void {
    this.isModalEspecificidadesOpen.set(false);
  }

  onEspecificidadeSalva(): void {
    this.carregarDadosSaude();
    this.dadosAtualizados.emit();
    this.fecharModalEspecificidades();
  }

  abrirModalLaudos(): void {
    this.isModalLaudosOpen.set(true);
  }

  fecharModalLaudos(): void {
    this.isModalLaudosOpen.set(false);
  }

  onLaudoSalvo(): void {
    this.carregarDadosSaude();
    this.dadosAtualizados.emit();
    this.fecharModalLaudos();
  }

  abrirModalMedicamento(): void {
    this.isModalMedicamentosOpen.set(true);
  }

  fecharModalMedicamento(): void {
    this.isModalMedicamentosOpen.set(false);
  }

  onMedicamentoSalvo(): void {
    this.carregarDadosSaude();
    this.dadosAtualizados.emit();
    this.fecharModalMedicamento();
  }


  private extrairFileId(driveUrl: string): string | null {
    const idMatch = driveUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    return idMatch ? (idMatch[1] ?? null) : null;
  }

  getDownloadUrl(driveUrl: string): string {
    const fileId = this.extrairFileId(driveUrl);
    return fileId ? `https://drive.google.com/uc?export=download&id=${fileId}` : driveUrl;
  }

  baixarDocumento(url: string): void {
    if (!url) return;
    const downloadUrl = this.getDownloadUrl(url);

    fetch(downloadUrl)
      .then(response => {
         if (!response.ok) throw new Error('Falha no download via fetch');
         return response.blob();
      })
      .then(blob => {
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = blobUrl;
        a.download = '';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
      })
      .catch(err => {
        console.warn('Erro ao forçar download via blob (CORS), usando fallback:', err);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = '';
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });
  }

  abrirPreview(url: string): void {
    if (!url) return;
    // Abre em nova aba — browsers modernos bloqueiam PDFs locais em iframe
    window.open(url, '_blank', 'noopener,noreferrer');
  }


}

