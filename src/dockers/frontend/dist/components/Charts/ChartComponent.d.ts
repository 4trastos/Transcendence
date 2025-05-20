import { Component } from "../../utils/component";
interface DataSeries {
    name: string;
    data: number[];
    color: string;
}
export declare class ChartComponent extends Component {
    protected props: any;
    protected categories: string[];
    protected series: DataSeries[];
    protected chartWidth: number;
    protected chartHeight: number;
    protected margin: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
    protected maxValue: number;
    protected minValue: number;
    constructor(props: any);
    renderTemplate(): string;
    protected initEvents(): Promise<void>;
    scaleY(value: number): number;
    scaleX(index: number): number;
    generateSmoothPath(data: number[]): string;
    drawChart(): void;
}
export {};
