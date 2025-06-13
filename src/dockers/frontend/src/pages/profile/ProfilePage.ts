import { Component} from "../../utils/component";
import { ProfileItemComponent } from "../../components/ProfileItem/ProfileItemComponent";
import { ProfileAuthItemComponent } from "../../components/ProfileItem/ProfileIAuthtemComponent";
import { ProfileHeaderItemComponent } from "../../components/ProfileItem/ProfileHeaderItemComponent";


export interface UserProfile {
        id: number,
        username: string,
        email:string,
        full_name: string,
        last_name: string,
        favourite_color: string,
        pfp: string,
        country: string,
        bio: string,
        contacts: []
}



export interface DataProfileChange {
        field:string, //IMAGE, DNI...
        value:string | File,
}

export interface DataPasswordChange {
    password:string,
    newPassword:string
}

export class ProfilePage extends Component {
    private fieldToKeyMap: Record<string, string> = {
        Username: "username",
        Email: "email",
        Country: "country",
        Avatar: "avatar_url",
        Color: "favourite_color"
    };

    private items: Map<string, ProfileItemComponent> = new Map<string, ProfileItemComponent>();
    private userProfile: UserProfile;
    private authItem: ProfileAuthItemComponent | undefined;
    private headerItem: ProfileHeaderItemComponent | undefined;
    constructor() {
    super();
    this.userProfile = {
        id: 12,
        username: "adrian",
        email: "adrianherrerare@yahoo.com",
        full_name: "",
        last_name: "",
        favourite_color: "",
        pfp: "/images/pfp.jpg",
        country: "",
        bio: "",
        contacts: []
    };
    this.template = `
    <div class="w-screen h-screen flex flex-col justify-center items-center ">
        <div class=" w-fit h-fit  flex flex-col overflow-hidden px-[5px] rounded bg-[linear-gradient(45deg,_#E615F2,_#1ADEF9)] shadow-[0_0_20px_rgba(0,0,0,0.5)] z-50">
            <div id="profile" class=" bg-[#11162F] flex flex-col w-fit h-fit space-y-4 px-[2rem] pb-8 pt-4">
                <!-- Carga los datos del profile: fdp, username, email... -->
                <div class="relative flex flex-row justify-center items-center"> 
                    <div id="div-username" class="text-white text-lg font-semibold">PERFIL</div>
                </div>
                <div id="div-detail" class="h-fit w-full flex flex-col " ></div>
            </div>		
        </div>
    </div>
        `;
    }

     async getUserProfiel(): Promise<UserProfile> { 
        const rs = await fetch("http://localhost:3000/api/profile", {
            method:"GET",
            credentials: "include"
        });
        //TODO: En caso deser un error que muestre un mensaje de no se pudo ver le perfil
        const profile = await rs.json();
        return profile.data as UserProfile;
    }

    protected async initEvents(): Promise<void> {
        if (!this.element){
            return;
        }
        this.userProfile = await this.getUserProfiel();
        console.log(this.userProfile);
        const profile = this.element.querySelector("#profile") as HTMLElement
        //Los datos cargados seran los adqueridos de la base de datos, de momento somo Manolo
        if (profile){
            const divImg = this.element.querySelector("#div-img") as HTMLElement
            const divUsername = this.element.querySelector("#div-username") as HTMLElement
            const divDetail = this.element.querySelector("#div-detail") as HTMLElement
            //Cargar los datos del usuario
            this.buildContent();
        }
    }

    buildContent() {

        if (!this.element) return;
        const divDetail = this.element.querySelector("#div-detail") as HTMLElement
        if (!divDetail) return;
        this.headerItem = new ProfileHeaderItemComponent({
            id:"0",
            field: "Username",
            value: this.userProfile.username,
            position:"first",
            classItem:" w-[29rem] ",
            avatarType: "image",
            hasEdit: true,
            onEdit: () => {
                this.toggleHiddenItems("0");
            },
            onSave: async (profile: DataProfileChange[]) => {
                let  profileUp = 1;
                if (profile.length > 0) {
                    profileUp = await this.updateAvatar(profile[1], ()=> {

                    }, () => {

                    });
                }

                if (profileUp) {
                    this.updateProfile(profile, () => {
                        this.toggleHiddenItems("0");
                        this.headerItem?.update({value: this.userProfile.username});
                        this.headerItem?.toggleView("Editar", true);
                    }, ()=> {
                        
                    });
                }
            }
        });

        const emailItem = new ProfileItemComponent({
            id:"1",
            field: "Email",
            value: this.userProfile.email,
            position:"middle",
            classItem:" w-[29rem] ",
            avatarType: "svg",
            hasEdit: true,
            onEdit: () => {
                this.toggleHiddenItems("1");

            },
            onSave: (profile: [DataProfileChange]) => {
                this.updateProfile(profile, () => {
                    this.toggleHiddenItems("1");
                    emailItem?.update({value: this.userProfile.email});
                }, ()=>{});

            }
        });

        const colorFavItem = new ProfileItemComponent({
            id:"2",
            field: "Color",
            value: this.userProfile.favourite_color,
            position:"middle",
            classItem:" w-[29rem] ",
            avatarType: "card",
            avatarColor: "#FFFF23",
            hasEdit: true,
            onEdit: () => {
                this.toggleHiddenItems("2");

            },
            onSave: (profile: [DataProfileChange]) => {
                this.updateProfile(profile, () => {
                    this.toggleHiddenItems("2");
                    colorFavItem?.update({value:this.userProfile.favourite_color});
                }, ()=> {});
            }
        });
        const countryItem = new ProfileItemComponent({
            id:"3",
            field: "Country",
            value: this.userProfile.country,
            position:"last",
            classItem:" w-[29rem] ",
            avatarType: "svg",
            hasEdit: true,
            onEdit: () => {
                this.toggleHiddenItems("3");
            },
            onSave: (profile: [DataProfileChange]) => {
                this.updateProfile(profile, () => {
                    this.toggleHiddenItems("3");
                    countryItem?.update({value: this.userProfile.country});
                }, ()=>{});
            }
        });

        this.authItem = new ProfileAuthItemComponent({
            id:"4",
            field: "Password",
            value: "*******",
            position:"middle",
            classItem:" w-[29rem] ",
            avatarType: "svg",
            hasEdit: true,
            onEdit: () => {
                console.log("onEdit: ");
                this.toggleHiddenItems("4");
            },
            onSave: (profile: [DataPasswordChange]) => {
                console.log("onSabe: ", profile);
                //TODO: Hacer un fetch put y si llega a ser satisfactorio hacer un toggle
                this.updatePassword(profile,
                    () => {
                        this.toggleHiddenItems("4");
                        this.authItem?.toggleView("Editar", true);
                    }, (msg:string)=>{
                        console.log(msg);
                        this.authItem?.showTemporaryPasswordError("current");
                    });
            }
        });
        divDetail.appendChild(this.headerItem.render());
        divDetail.appendChild(emailItem.render());
        divDetail.appendChild(this.authItem.render());
        divDetail.appendChild(colorFavItem.render());
        divDetail.appendChild(countryItem.render());
        this.items.set("1",emailItem);
        this.items.set("2",colorFavItem);
        this.items.set("3",countryItem);
    }

    async updateAvatar(data: DataProfileChange, callBack: ()=>void, onError: ()=>void): Promise<number>{
        const formData = new FormData();
        formData.append('image', data.value);

        try {
            const response = await fetch('http://localhost:3000/api/upload-avatar', {
            method: 'POST',
            body: formData,
            });

            callBack();
            return 1;
        } catch (err) {
            console.error(err);
            onError();
            return 0;
        }
    }

    async updateProfile(profile: DataProfileChange[], callBack: ()=>void, onError: ()=>void) {
        const updateDto: Record<string, string | File> = {};
        for (const item of profile) {
            const key = this.fieldToKeyMap[item.field];
            if (key)
                updateDto[key] = item.value;
        }
        const response = await fetch("http://localhost:3000/api/profile", {
            method: "PUT",
            headers: {
                "accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updateDto),
            credentials: "include",
        });
        if (response.status === 200 || response.status === 201) {
            this.userProfile = { ...this.userProfile, ...updateDto};
            console.log(await response.json())
            callBack();
        } else {
            onError();
        }
    }

    async updatePassword(profile: [DataPasswordChange], callBack: ()=> void, onError: (msg:string)=> void) {
        const updateCredential = {currentPassword: profile[0].password, newPassword: profile[0].newPassword};
        const response = await fetch("http://localhost:3000/api/change-password", {
            method: "PUT",
            headers: {
                "accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updateCredential),
            credentials: "include",
        });
        if (response.status === 200 || response.status === 201){
            callBack();
        } else {
            console.log("status: " + response.status)
            console.log(await response.json())
            onError(response.statusText);
        }

    }

    toggleHiddenItems(id: string) {
        for (const [key, item] of this.items.entries()) {
            if (key !== id && item) {
                item.toggleHidden();
            }
        }
        if ("4" !== id){
             this.authItem?.toggleHidden();
        }
        
        if ("0" !== id){
             this.headerItem?.toggleHidden();
        }
    }
}