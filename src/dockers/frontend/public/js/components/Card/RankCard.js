import { Component } from "../../utils/component.js";
import { Card } from "./Card.js";
class RankItem extends Component {
    constructor(props) {
        super(props);
        this.props = props;
        this.template = this.renderTemplate();
    }
    renderTemplate() {
        return `
			<div class="flex justify-center w-full"> 
				<div class="flex w-full max-w-md overflow-hidden min-w-0 items-center space-x-3 py-3 px-4 hover:bg-white hover:bg-opacity-5 cursor-pointer">
					<div class="flex-shrink-0 text-white font-semibold">${this.props.position}#</div>
					<div class="flex-1 min-w-0">
						<p class="text-white font-regular text-sm">${this.props.name}</p>
						<p class="text-gray-400 text-xs font-ligth truncate">points: ${this.props.stat?.points} wins:  ${this.props.stat?.wins}</p>
					</div>
					<div class="flex-shrink-0 self-center">
						${!this.props.isGroupChat ? `<div id="chat-item-status" class="w-1.5 h-1.5 aspect-square rounded-full"></div>` : ''}
					</div>
				</div>
			</div>
		`;
    }
}
export class RankCardContent extends Component {
    constructor(props) {
        super(props);
        this.template = this.renderTemplate();
    }
    renderTemplate() {
        return `
			<div class="items-center w-full px-5 py-3"> 
				<div id="rank-list" class="h-fit w-full overflow-y-auto mb-4 rounded-2xl bg-white bg-opacity-10">
				</div>
			</div>
		`;
    }
    initEvents() {
        if (!this.element)
            return;
        const rankList = this.element?.querySelector(`#rank-list`);
        if (!rankList)
            return;
        this.props.users?.forEach((user) => {
            const rankItem1 = new RankItem({
                position: user.stats?.rank,
                name: user.username,
                stat: user.stats,
            });
            rankList.appendChild(rankItem1.render());
        });
    }
}
export class RankCard extends Card {
    constructor(props) {
        const defaultProps = {
            id: "rank-card",
            title: "Rank",
            width: "w-[18rem]",
            height: "h-[24rem]",
        };
        props = { ...defaultProps, ...props };
        const rankCardProps = new RankCardContent({
            users: props.users,
        });
        super({ ...props, content: rankCardProps });
    }
}
//# sourceMappingURL=RankCard.js.map