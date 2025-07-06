import { Card, ChartCard } from "../../components/Card/Card";
import { RankCard } from "../../components/Card/RankCard";
import { ChartComponent } from "../../components/Charts/ChartComponent";
import { CircularProgressCardComponent } from "../../components/CircularProgressCard/CircularProgressCardComponent";
import { Stat } from "../../data/User";
import { Component } from "../../utils/component";
import { ToastService } from "../../utils/toast";


interface StatsDto {
	summary: {
		username: string;
		games_won: number;
		total_score_won: number;
		total_score_lost: number;
		total_games: number;
	};
	scoreByDate: {
		date: string;
		totalScore: number;
		totalWon: number;
	}[];
}
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
		
		//TODO: hacer un Skeleton loading luego 
		const userStats = await this.getStats(); 
		console.log(userStats);
		if (!userStats) {
			ToastService.show("No se pudieron cargar las estadisticas", "error");
			//ERROR: No se pudieron cargar las estadisticas.
			return;
		}
		//Gestionar los estados en caso de esperar las graficas
		const centerStats = this.element.querySelector("#center-stats") as HTMLElement;
		if (centerStats) {
			const chart = new ChartComponent({
				series:[
					{
						name: "Score per Day",
						data: userStats.scoreByDate.map(item=>item.totalScore),
						color: "#FFFFFF",
					},
					{
						name: "Won per Day",
						data: userStats.scoreByDate.map(item=>item.totalWon),
						color: "#FFFFFF",
					}
				],
				categories: userStats.scoreByDate.map(item=>{ 
					const date = new Date(item.date);
					return date.toLocaleTimeString('en-GB', {
						hour: '2-digit',
						minute: '2-digit',
						hour12: false
					});
				})
			});
			centerStats.appendChild(chart.render());
		}
		const leftStats = this.element.querySelector("#left-stats") as HTMLElement;
		if (leftStats) {
			const progressWon = (userStats.summary.games_won / userStats.summary?.total_games) * 100; 
			const totalScore = userStats.summary.total_score_lost * userStats.summary.total_score_won;
			const progressPoint = ( totalScore / userStats.summary.total_games) ; 
			const chart = new CircularProgressCardComponent({
				progress: progressWon,
				title: "Games won",
				description: `${progressWon}% of games won`,
				contentTitle: "Games won",
				contentText: `${progressWon}% of games won`,
			});
			const chart2 = new CircularProgressCardComponent({
				progress: progressPoint,
				title: "Points per Game",
				description: `Average points per game: ${totalScore} points`,
				contentTitle: "Points per Game",
				contentText: `${totalScore} points per game (${progressPoint}% of the maximum points)`,
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
					],
			});
			
			rigthStats.appendChild(card.render());
		}
	}


	private async getStats(): Promise<StatsDto | null> {
		try {
		const response = await fetch("/backend/api/stats/user/games", {
				method: "GET",
				headers: {
					"Accept": "application/json"
				},
				credentials: "include"
			});
			if (response.ok) {
				const stats = await response.json();
				return stats as StatsDto;
			}
			return null;
		} catch (error) {
			return null;
		}
	}
}