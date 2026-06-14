import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EstudantesService, EstudanteSaude } from '../../../../shared/services/estudantes.service'; // Ajusta o path

@Component({
  selector: 'app-bloco-saude',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bloco-saude.html',
  styleUrls: ['./bloco-saude.css']
})
export class BlocoSaudeComponent implements OnInit {
  @Input() estudanteId!: string;
  
  dadosSaude: EstudanteSaude | null = null;
  isDropdownOpen = false;
  isLoading = false;

  constructor(private estudantesService: EstudantesService) {}

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
}