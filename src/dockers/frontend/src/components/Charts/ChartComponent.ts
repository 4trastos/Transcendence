import { Component } from "../../utils/component";

interface DataSeries {
	name: string;
	data: number[];
	color: string;
  }


export class ChartComponent extends Component {
  protected props: any;
  protected categories = ['01 Feb', '02 Feb', '03 Feb', '04 Feb', '05 Feb', '06 Feb', '07 Feb', '08 Feb', '09 Feb', '10 Feb'];
  protected series: DataSeries[] = [
	{
	  name: "Designer Edition",
	  data: [64, 44, 61, 45, 52, 25, 41, 12, 42, 73],
	  color: "#FFFFFF",
	},
  ];
  
  protected chartWidth = 700;
  protected chartHeight = 300;
  protected margin = { top: 10, right: 10, bottom: 40, left: 50 };
  protected maxValue;
  protected minValue = 0;

  constructor(props: any) {
	super(props);
	this.props = props;
	this.template = this.renderTemplate();
	this.maxValue = Math.max(...this.series.flatMap(s => s.data));

  }

  renderTemplate() {
	return `
	<div id="${this.props.id}" class="backdrop-blur-3xl bg-opacity-15 bg-[#1D1F2B] w-[38rem] h-[22rem] border border-white border-opacity-15 rounded-2xl shadow-lg flex flex-col overflow-hidden xl:col-span-1 justify-center items-center">
		<!-- Header del chat -->	
		<div id="${this.props.id}-header" class="relative flex justify-center items-center space-x-2 px-4 py-2 text-center text-white text-sm">
		Games won per day
		</div>

		<!-- Divider -->
		<hr id="${this.props.id}-divider"
			class="w-full border-t border-white border-opacity-15" />

		<!-- Aquí puedes agregar el contenido del chat -->
		<div id="${this.props.id}-body" class=" flex-1 py-2 px-5 overflow-y-auto text-sm  space-y-2">
			<svg id="labels-chart" viewBox="0 0 700 300" class="w-full h-full"></svg>
		</div>
	</div>
	`;
  }
  protected async initEvents(): Promise<void> {
	if (!this.element) return;

	  this.drawChart();
	  

}
scaleY(value: number): number {
	return this.chartHeight - this.margin.bottom - ((value - this.minValue) / (this.maxValue - this.minValue)) * (this.chartHeight - this.margin.top - this.margin.bottom);
  }
scaleX(index: number): number {
	const spacing = (this.chartWidth - this.margin.left - this.margin.right) / (this.categories.length - 1);
	return this.margin.left + index * spacing;
  }
  
  generateSmoothPath(data: number[]): string {
	let d = `M${this.scaleX(0)},${this.scaleY(data[0])}`;
	for (let i = 0; i < data.length - 1; i++) {
	  const x0 = this.scaleX(i);
	  const y0 = this.scaleY(data[i]);
	  const x1 = this.scaleX(i + 1);
	  const y1 = this.scaleY(data[i + 1]);
	  const cx = (x0 + x1) / 2;
	  const cy = (y0 + y1) / 2;
	  d += ` Q${x0},${y0} ${cx},${cy}`;
	}
	d += ` T${this.scaleX(data.length - 1)},${this.scaleY(data[data.length - 1])}`;

	return d;
  }
 drawChart() {
	const svg = this.element?.querySelector("#labels-chart") as SVGSVGElement;
	if (!svg) return;
  
	// Clear existing
	svg.innerHTML = '';
  
	// Draw X-axis labels
	this.categories.forEach((label:any, i) => {
	  const x = this.scaleX(i);
	  svg.innerHTML += `<text x="${x}" y="${this.chartHeight - 10}" class="text-xs fill-gray-500 dark:fill-gray-400" text-anchor="middle">${label}</text>`;
	});
  
	// Draw Y-axis labels
	for (let yVal = this.minValue; yVal <= this.maxValue; yVal += 50) {
	  const y = this.scaleY(yVal);
	  svg.innerHTML += `<text x="10" y="${y}" class="text-xs fill-gray-500 dark:fill-gray-400" text-anchor="start" alignment-baseline="middle">$${yVal}</text>`;
	}
  
	// Draw each series as area
	this.series.forEach(serie => {
	  const path = this.generateSmoothPath(serie.data);
	  const areaPath = `${path} L${this.scaleX(serie.data.length - 1)},${this.chartHeight - this.margin.bottom} L${this.scaleX(0)},${this.chartHeight - this.margin.bottom} Z`;
  
	  svg.innerHTML += `
		<defs>
			<linearGradient id="gradient-${serie.color}" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0%" stop-color="${serie.color}" stop-opacity="0.07"/>
			<stop offset="100%" stop-color="${serie.color}" stop-opacity="0"/>
			</linearGradient>
		</defs>
		<path d="${areaPath}" fill="url(#gradient-${serie.color})" stroke="none"></path>
		<path d="${path}" fill="none" stroke="${serie.color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path>
	  `;
	});
  }

} 