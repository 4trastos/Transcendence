import { Component } from "../../utils/component.js";
class SelectOpponentView extends Component {
    constructor(props) {
        super(props);
        this.props = props;
        this.template = this.renderTemplate();
    }
    renderTemplate() {
        return `
  <div class="w-full h-full flex items-center justify-center">
    <div class="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center text-white text-2xl">
      Select an opponent
    </div>
  </div>`;
    }
}
class MatchedView extends Component {
}
class WaitingOpponentView extends Component {
    constructor(props) {
        super(props);
        this.props = props;
        this.template = this.renderTemplate();
    }
    renderTemplate() {
        return `
  <div class="w-full h-full flex items-center justify-center">
    <div class="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center text-white text-2xl">
      Waiting for opponent...
    </div>
  </div>`;
    }
}
class ScoreboardComponent extends Component {
    constructor(props) {
        super(props);
        this.props = props;
        this.template = this.renderTemplate();
    }
    renderTemplate() {
        return `
  <div id="scoreboard" class="w-32 h-16 bg-gray-800 rounded flex items-center justify-center text-white">
    <span id="score" class="text-2xl">0 - 0</span>
  </div>
  `;
    }
}
class Player {
}
class PaddleComponent extends Component {
    constructor(props) {
        super(props);
        this.props = props;
        this.template = this.renderTemplate();
    }
    renderTemplate() {
        return `
  <div id="paddle" class="w-4 h-16 bg-blue-500 rounded"></div>
  `;
    }
}
class BolletComponent extends Component {
    constructor(props) {
        super(props);
        this.props = props;
        this.template = this.renderTemplate();
    }
    renderTemplate() {
        return `
  <div id="ball" class="w-4 h-4 bg-red-500 rounded-full"></div>
  `;
    }
}
class PingPongGame {
    constructor() {
    }
    startGame() {
    }
    updateGameState() {
    }
}
class GamePage extends Component {
    constructor(userId, gameId) {
        super();
        this.userId = userId;
        this.gameId = gameId;
        this.template = this.renderTemplate();
    }
    renderTemplate() {
        return `
	<div class="game-view">
	</div>
	`;
    }
    async initEvents() {
        if (!this.element)
            return;
        this.socket = new WebSocket("");
    }
}
//# sourceMappingURL=GamePage.js.map