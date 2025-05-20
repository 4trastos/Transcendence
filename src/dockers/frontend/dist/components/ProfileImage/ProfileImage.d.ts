import { Component, ComponentProps } from "../../utils/component";
interface ProfileImageProps extends ComponentProps {
    src: string;
    alt?: string;
    size?: number;
    className?: string;
}
export declare class ProfileImage extends Component {
    protected props: ProfileImageProps;
    constructor(props: ProfileImageProps);
    renderTemplate(): string;
}
export {};
