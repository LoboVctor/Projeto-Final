import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { EstudantesService, EstudanteSaude } from '../../../../shared/services/estudantes.service';
// Mantendo o caminho do arquivo exatamente como você solicitou:
import { ModalEspecificidadesComponent } from './modais/restricoes'; 

@Component({
  selector: 'app-bloco-saude',
  standalone: true,
  imports: [CommonModule, ModalEspecificidadesComponent], 
  templateUrl: './bloco-saude.html',
  styleUrls: ['./bloco-saude.css']
})
export class BlocoSaudeComponent implements OnInit {
  @Input() estudanteId!: string;
  
  dadosSaude: EstudanteSaude | null = null;
  
  especificidadesAlimentares: any[] = [];
  outrasEspecificidades: any[] = [];
  
  isDropdownOpen = false;
  isLoading = false;

  isPreviewOpen = false;
  isModalEspecificidadesOpen = false;
  safePreviewUrl: SafeResourceUrl | null = null;

  private sanitizer = inject(DomSanitizer);
  private estudantesService = inject(EstudantesService);

  ngOnInit(): void {
    if (this.estudanteId) {
      this.carregarDadosSaude();
    }
  }

  carregarDadosSaude(): void {
    this.isLoading = true;
    this.estudantesService.getSaude(this.estudanteId).subscribe({
      next: (dados) => {
        this.dadosSaude = dados;
        
        // 👇 A MÁGICA ACONTECE AQUI:
        // 1. Agora lemos de 'dados.especificidades' (conforme o backend)
        // 2. Filtramos pela 'categoria' (Alimentar vs Resto)
        this.especificidadesAlimentares = dados.especificidades.filter(e => e.categoria === 'ALIMENTAR');
        this.outrasEspecificidades = dados.especificidades.filter(e => e.categoria !== 'ALIMENTAR');
        
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao buscar dados de saúde', err);
        this.isLoading = false;
      }
    });
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  // --- CONTROLES DO MODAL FILHO ---
  abrirModalEspecificidades(): void {
    this.isModalEspecificidadesOpen = true;
  }

  fecharModalEspecificidades(): void {
    this.isModalEspecificidadesOpen = false;
  }

  // --- MÉTODOS DO GOOGLE DRIVE ---
  private extrairFileId(driveUrl: string): string | null {
    const idMatch = driveUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    return idMatch ? idMatch[1] : null;
  }

  getDownloadUrl(driveUrl: string): string {
    const fileId = this.extrairFileId(driveUrl);
    return fileId ? `https://drive.google.com/uc?export=download&id=${fileId}` : driveUrl;
  }

  abrirPreview(driveUrl: string): void {
    const fileId = this.extrairFileId(driveUrl);
    if (fileId) {
      this.safePreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(`https://drive.google.com/file/d/${fileId}/preview`);
      this.isPreviewOpen = true;
    }
  }

  fecharPreview(): void {
    this.isPreviewOpen = false;
  }

  // Placeholders para as próximas sprints
  adicionarMedicamento(): void {}
  adicionarLaudo(): void {}
}