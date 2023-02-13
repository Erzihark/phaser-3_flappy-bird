import BaseScene from "./BaseScene";


class ScoreScene extends BaseScene{
    constructor(config){
        super('ScoreScene', {...config, canGoBack: true});

        
    }

    create(){
        super.create();

        const bestScoreText = localStorage.getItem("bestScore");
        this.add.text(...this.screenCenter, `Score: ${bestScoreText || 0}`, this.fontOptions).setOrigin(0.5);
    }

}

export default ScoreScene;

//create score scene
// display score, can get from local storage