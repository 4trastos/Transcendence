import { Component, ComponentProps } from "../../utils/component";

interface DataSeries {
	name: string;
	data: number[];
	color: string;
  }


export interface ChartComponentProps extends ComponentProps {
	series: DataSeries[];
	categories: string[];
}
export class ChartComponent extends Component {
  protected props: ChartComponentProps;
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

  constructor(props: ChartComponentProps) {
	super(props);
	this.props = props;
	this.series = props.series;
	this.categories = props.categories;
	this.template = this.renderTemplate();
	this.maxValue = Math.max(...this.series.flatMap(s => s.data));
	console.log(props.categories, props.series)
  }

  renderTemplate() {
	return `
	<div  class="animate-expand-from-center  w-fit h-fit  flex flex-col overflow-hidden px-[5px] rounded bg-gradient-animate shadow-[0_0_20px_rgba(0,0,0,0.5)] ">
		<div  id="${this.props.id}" class=" reveal-content backdrop-blur-3xl bg-[#11162F] flex flex-col w-[38rem] h-[22rem] space-y-4 px-[1rem] pb-8 pt-4">
			<!-- Header del chat -->	
			<div id="${this.props.id}-header" class="reveal-content-child  relative flex justify-center items-center space-x-2 px-4 py-2 text-center text-white text-sm">
			Games won and score per time
			</div>

			<!-- Aquí puedes agregar el contenido del chat -->
			<div id="${this.props.id}-body" class="reveal-content-child flex-1 py-2 px-5 overflow-y-auto text-sm  space-y-2">
				<svg id="labels-chart" viewBox="0 0 700 300" class="w-full h-full"></svg>
			</div>
		</div>
	</div>
	`;
  }
  protected async initEvents(): Promise<void> {
		if (!this.element) return;
		this.drawChart();
		setTimeout(() => {
			if (!this.element) return;
			this.element.classList.remove('animate-expand-from-center');
		}, 1000);
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
	  svg.innerHTML += `<text x="10" y="${y}" class="text-xs fill-gray-500 dark:fill-gray-400" text-anchor="start" alignment-baseline="middle">${yVal}</text>`;
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