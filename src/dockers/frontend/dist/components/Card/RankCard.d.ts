import { User } from "../../data/User";
import { Component } from "../../utils/component";
import { Card, CardProps } from "./Card";
interface RankCardContentProps {
    users?: User[];
}
export declare class RankCardContent extends Component {
    constructor(props: RankCardContentProps);
    renderTemplate(): string;
    protected initEvents(): void;
}
interface RankCardProps extends CardProps {
    users?: User[];
}
export declare class RankCard extends Card {
    constructor(props: RankCardProps);
}
export {};
