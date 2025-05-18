// src/pages/home/home.ts
import { Button } from '../../components/Button/Button';
import { Card } from '../../components/Card/Card';
import { Navigation } from '../../components/Navigation/Navigation';
import { Component } from '../../utils/component';

export class HomePage extends Component {
  constructor() {
    super();
    this.template = `<div class="container mx-auto ">
  <div id="navigation-container"></div>
  <h1 class="text-3xl font-bold mt-6 mb-4">Bienvenido a mi aplicación modular</h1>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <div id="card-1"></div>
    <div id="card-2"></div>
    <div id="card-3"></div>
  </div>
</div>`;
  }

  protected initEvents(): void {
    if (!this.element) return;

    // Crear tarjetas con botones
    for (let i = 1; i <= 3; i++) {
      const button = new Button({
        text: `Acción ${i}`,
        onClick: () => {
          alert(`Botón ${i} clickeado!`);
        }
      });
      

    }
  }
}