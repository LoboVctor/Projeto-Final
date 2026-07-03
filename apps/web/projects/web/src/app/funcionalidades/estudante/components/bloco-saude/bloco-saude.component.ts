import {
  Component,
  Output,
  EventEmitter,
  OnInit,
  inject,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  EstudantesService,
  EstudanteSaude } from '../../../../compartilhado/services/estudantes.service';
import { ModalEspecificidadesComponent } from './modais/restricoes-modal.component';
import { ModalMedicamentosComponent } from './modais/medicamentos-modal.component';
import { ModalLaudosComponent } from './modais/laudos-modal.component';

@Component({
  selector: 'app-bloco-saude',
  imports: [CommonModule, ModalEspecificidadesComponent, ModalMedicamentosComponent, ModalLaudosComponent],
  templateUrl: './bloco-saude.component.html',
  styleUrls: ['./bloco-saude.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush })
export class BlocoSaudeComponent implements OnInit {
  readonly estudanteId = input.required<string>();
  @Output() recolher = new EventEmitter<void>();

  dadosSaude: EstudanteSaude | null = null;
  restricoes: any[] = [];
  especificidadesAlimentares: any[] = [];
  outrasEspecificidades: any[] = [];

  isLoading = false;
  isModalEspecificidadesOpen = false;
  isModalMedicamentosOpen = false;
  isModalLaudosOpen = false;

  private estudantesService = inject(EstudantesService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    if (this.estudanteId()) {
      this.carregarDadosSaude();
    }
  }

  carregarDadosSaude(): void {
    this.isLoading = true;
    this.estudantesService.getSaude(this.estudanteId()).subscribe({
      next: (dados) => {
        this.dadosSaude = dados;

        this.restricoes = dados.especificidades.filter((e: any) => e.tipo === 'RESTRICAO');

        this.especificidadesAlimentares = this.restricoes.filter(
          (e: any) => e.categoria === 'ALIMENTAR',
        );
        this.outrasEspecificidades = this.restricoes.filter(
          (e: any) => e.categoria !== 'ALIMENTAR',
        );

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {

        this.isLoading = false;
        this.cdr.detectChanges();
      } });
  }

  onRecolher(): void {
    this.recolher.emit();
  }


  abrirModalEspecificidades(): void {
    this.isModalEspecificidadesOpen = true;
  }

  fecharModalEspecificidades(): void {
    this.isModalEspecificidadesOpen = false;
  }

  onEspecificidadeSalva(): void {
    this.fecharModalEspecificidades();
  }

  abrirModalLaudos(): void {
    this.isModalLaudosOpen = true;
  }

  fecharModalLaudos(): void {
    this.isModalLaudosOpen = false;
  }

  onLaudoSalvo(): void {
    this.fecharModalLaudos();
  }

  abrirModalMedicamento(): void {
    this.isModalMedicamentosOpen = true;
  }

  fecharModalMedicamento(): void {
    this.isModalMedicamentosOpen = false;
  }

  onMedicamentoSalvo(): void {
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

