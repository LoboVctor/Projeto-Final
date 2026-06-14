import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms'; // 👈 Importe aqui
import { EstudantesService, EstudanteSaude } from '../../../../shared/services/estudantes.service';

@Component({
  selector: 'app-bloco-saude',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule], // 👈 Adicione ReactiveFormsModule
  templateUrl: './bloco-saude.component.html',
  styleUrls: ['./bloco-saude.component.css']
})
export class BlocoSaudeComponent implements OnInit {
  @Input() estudanteId!: string;
  
  dadosSaude: EstudanteSaude | null = null;
  restricoesAlimentares: any[] = [];
  restricoesOutras: any[] = [];
  
  isLoading = false;
  isDropdownOpen = false;

  // Estados dos Modais
  isPreviewOpen = false;
  isEditModalOpen = false;
  safePreviewUrl: SafeResourceUrl | null = null;

  // Formulário
  restricaoForm: FormGroup;
  editingRestricaoId: string | null = null;

  private fb = inject(FormBuilder);
  private sanitizer = inject(DomSanitizer);
  private estudantesService = inject(EstudantesService);

  constructor() {
    this.restricaoForm = this.fb.group({
      tipo: ['ALIMENTAR', Validators.required],
      categoria: ['ALERGIA', Validators.required],
      descricao: ['', [Validators.required, Validators.minLength(3)]],
      observacao: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    if (this.estudanteId) this.carregarDadosSaude();
  }

  carregarDadosSaude(): void {
    this.isLoading = true;
    this.estudantesService.getSaude(this.estudanteId).subscribe({
      next: (dados) => {
        this.dadosSaude = dados;
        this.atualizarListas();
        this.isLoading = false;
      }
    });
  }

  atualizarListas() {
    if (!this.dadosSaude) return;
    this.restricoesAlimentares = this.dadosSaude.restricoes.filter(r => r.tipo === 'ALIMENTAR');
    this.restricoesOutras = this.dadosSaude.restricoes.filter(r => r.tipo !== 'ALIMENTAR');
  }

  // --- CRUD RESTRIÇÕES ---

  abrirModalRestricao(restricao?: any) {
    this.isEditModalOpen = true;
    if (restricao) {
      this.editingRestricaoId = restricao.id;
      this.restricaoForm.patchValue(restricao);
    } else {
      this.editingRestricaoId = null;
      this.restricaoForm.reset({ tipo: 'ALIMENTAR', categoria: 'ALERGIA' });
    }
  }

  fecharModalRestricao() {
    this.isEditModalOpen = false;
    this.editingRestricaoId = null;
  }

  salvarRestricao() {
    if (this.restricaoForm.invalid) return;

    const dados = this.restricaoForm.value;
    const acao = this.editingRestricaoId 
      ? this.estudantesService.updateRestricao(this.editingRestricaoId, dados)
      : this.estudantesService.saveRestricao(this.estudanteId, dados);

    acao.subscribe({
      next: () => {
        this.carregarDadosSaude();
        this.fecharModalRestricao();
      }
    });
  }

  excluirRestricao(id: string) {
    if (confirm('Tem certeza que deseja remover esta restrição?')) {
      this.estudantesService.deleteRestricao(id).subscribe(() => {
        this.carregarDadosSaude();
      });
    }
  }

  // --- MÉTODOS GOOGLE DRIVE (Mantidos) ---
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

  fecharPreview() { this.isPreviewOpen = false; }
  toggleDropdown() { this.isDropdownOpen = !this.isDropdownOpen; }
}