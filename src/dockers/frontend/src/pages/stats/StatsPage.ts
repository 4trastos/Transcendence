import { Card, ChartCard } from "../../components/Card/Card";
import { RankCard, RankCardContent } from "../../components/Card/RankCard";
import { ChartComponent } from "../../components/Charts/ChartComponent";
import { CircularProgressCardComponent } from "../../components/CircularProgressCard/CircularProgressCardComponent";
import { Component } from "../../utils/component";


export class StatsPage extends Component {
	
	constructor() {
		super();
		this.template = `
		<div class="w-full min-h-screen my-12 xl:my-0 flex flex-col justify-center items-center">
			<div class="grid grid-cols-1 w-fit xl:grid-cols-3 justify-center gap-x-2 gap-y-2 place-items-center items-start h-fit p-4">
			<div id="left-stats"  class="flex flex-col gap-6 xl:col-span-1 items-start">
			</div>

			<div id="center-stats">
				<!-- Este es el item 3 (chart o similar) -->
			</div>

			<div id="rigth-stats" class="flex flex-col gap-6 xl:col-span-1 items-start">
				
			</div>
			</div>
		</div>
		`;
	}

	protected async initEvents(): Promise<void> {
		if (!this.element) return;
		const centerStats = this.element.querySelector("#center-stats") as HTMLElement;
		if (centerStats) {
			const chart = new ChartComponent({});
			centerStats.appendChild(chart.render());
		}
		const leftStats = this.element.querySelector("#left-stats") as HTMLElement;
		if (leftStats) {
			const chart = new CircularProgressCardComponent({
				progress: 75,
				title: "Games won",
				description: "75% of games won",
				contentTitle: "Games won",
				contentText: "75% of games won",
			});
			const chart2 = new CircularProgressCardComponent({
				progress: 85,
				title: "Points per Game",
				description: "Average points per game: 850 points",
				contentTitle: "Points per Game",
				contentText: "850 points per game (85% of the maximum points)",
			});
			leftStats.appendChild(chart.render());
			leftStats.appendChild(chart2.render());
		}
		const rigthStats = this.element.querySelector("#rigth-stats") as HTMLElement;
		if (rigthStats) {
			const card = new RankCard({
				id: "card-1",
				title: "Rank",
				width: "w-[18rem]",
				height: "h-[23rem]",
				users: [
						{ username: "Henry Fisher", stats: {points: 1000, wins: 10, losses:23, rank:3 } },
						{ username: "John Doe", stats: {points: 900, wins: 8, losses: 15, rank:2 } },
						{ username: "Jane Smith", stats: {points: 800, wins: 5, losses: 10, rank:1 } },
						{ username: "Alice Johnson", stats: {points: 700, wins: 3, losses: 5, rank:4 } },
						{ username: "Bob Brown", stats: {points: 600, wins: 2, losses: 3, rank:5 } },				
					],
			});
			
			rigthStats.appendChild(card.render());
		}
	}
}