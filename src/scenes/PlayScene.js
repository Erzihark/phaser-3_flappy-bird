import BaseScene from './BaseScene'
const PIPES_TO_RENDER = 4;

class PlayScene extends BaseScene{

    constructor(config){
        super('PlayScene', config);

        this.initialBirdPosition = {
            x: 80,
            y: 300
        }
        this.bird = null;
        this.pipes = null;
        this.isPaused = false;

        this.pipeHorizontalDistance = 0;
        this.flapVelocity = 300;

        this.score = 0;
        this.scoreText = '';

        this.currentDifficulty = 'easy';
        this.difficulties = {
            'easy': {
                pipeHorizontalDistanceRange: [300, 350],
                pipeVerticalDistanceRange: [150, 200]
            },
            'normal': {
                pipeHorizontalDistanceRange: [280, 330],
                pipeVerticalDistanceRange: [140, 190]
            },
            'hard': {
                pipeHorizontalDistanceRange: [250, 310],
                pipeVerticalDistanceRange: [120, 170]
            },
        }
    }

    create(){
        //executes parent class 'create' function
        this.currentDifficulty = 'easy';
        super.create();
        this.createBird();
        this.createPipes();
        this.createColliders();
        this.createScore();
        this.createPause();
        this.handleInputs();
        this.listenToEvents();

        this.anims.create({
            key:'fly',
            frames: this.anims.generateFrameNumbers('bird', {start: 8, end: 15}),
            frameRate: 8,
            repeat: -1
        });
        this.bird.play('fly');
    }

    update(){
        this.checkGameStatus();
        this.pipePooler();
    }

    listenToEvents(){
        if(this.pauseEvent) return;

        this.pauseEvent = this.events.on('resume', ()=>{
            this.timer = 3;
            this.countdownText = this.add.text(...this.screenCenter, 'Fly in: ' + this.timer, this.fontOptions).setOrigin(0.5);
            this.timedEvent = this.time.addEvent({
                delay: 1000,
                callback: this.countdown,
                callbackScope: this,
                loop: true
            })
        })
    }

    countdown(){
        this.timer--;
        this.countdownText.setText('Fly in: ' + this.timer);
        if (this.timer <= 0){
            this.isPaused = false;
            this.countdownText.setText('');
            this.physics.resume();
            this.timedEvent.remove();
        }
    }

    createBird(){
        this.bird = this.physics.add.sprite(this.config.startPosition.x, this.config.startPosition.y, 'bird').setFlipX(true).setScale(3).setOrigin(0);
        this.bird.setBodySize(this.bird.width, this.bird.height - 8)
        this.bird.body.gravity.y = 600;
        this.bird.setCollideWorldBounds(true);
    }

    createPipes(){
        this.pipes = this.physics.add.group();

        for(let i = 0; i < PIPES_TO_RENDER; i++){
            const upperPipe = this.pipes.create(0, 0, 'pipe').setImmovable(true).setOrigin(0, 1);
            const lowerPipe = this.pipes.create(0, 0, 'pipe').setImmovable(true).setOrigin(0, 0);

            this.placePipe(upperPipe, lowerPipe)
        }

        this.pipes.setVelocityX(-200);
    }

    createColliders(){
        this.physics.add.collider(this.bird, this.pipes, this.gameOver, null, this);
    }

    createScore(){
        this.score = 0;
        const bestScore = localStorage.getItem("bestScore");
        this.scoreText = this.add.text(16, 16, `Score: ${0}`, {fontSize: '32px', fill: '#000'});
        this.add.text(16, 52, `Best score: ${bestScore || 0}`, {fontSize: '18px', fill: '#000'})
    }

    createPause(){
       const pauseButton = this.add.image(this.config.width - 10, this.config.height - 10, 'pause').setInteractive().setScale(3).setOrigin(1);

       pauseButton.on('pointerdown', () => {
        this.isPaused = true;
        this.physics.pause();
        this.scene.pause();
        this.scene.launch('PauseScene');
       })
    }

    handleInputs(){
        this.input.on('pointerdown', this.flap, this);
        this.input.keyboard.on('keydown_SPACE', this.flap, this);
    }

    checkGameStatus(){
        if(this.bird.y >= this.config.height - this.bird.height){
            this.gameOver();
        }
    }

    placePipe(uPipe, lPipe){
        const difficulty = this.difficulties[this.currentDifficulty];
        const rightMostX = this.getRightmostPipe();
      
        let pipeVerticalDistance = Phaser.Math.Between(...difficulty.pipeVerticalDistanceRange);
        let pipeVerticalPosition = Phaser.Math.Between(0 + 20, this.config.height - 20 - pipeVerticalDistance);
        let pipeHorizontalDistance = Phaser.Math.Between(...difficulty.pipeHorizontalDistanceRange);
      
        uPipe.x = rightMostX + pipeHorizontalDistance;
        uPipe.y = pipeVerticalPosition;
      
        lPipe.x = uPipe.x;
        lPipe.y = uPipe.y + pipeVerticalDistance;
      
    }
      
    pipePooler(){
        const tempPipes = [];
        
        this.pipes.getChildren().forEach(pipe =>{
            if (pipe.getBounds().right < 0){
                tempPipes.push(pipe);
                if(tempPipes.length === 2){
                    this.placePipe(...tempPipes);
                    this.increaseScore();
                    this.setBestScore();
                    this.increaseDifficulty();
                }
            }
        })
    }

    increaseDifficulty(){
        if(this.score === 50){
            this.currentDifficulty = 'normal'
        }
        if(this.score === 100){
            this.currentDifficulty = 'hard'
        }
        
    }

    getRightmostPipe(){
        let rightMostX = 0;
      
        this.pipes.getChildren().forEach(pipe => {
          rightMostX = Math.max(rightMostX, pipe.x)
        });
      
        return rightMostX;
    }
      
    flap(){
        if (this.isPaused) return;
        this.bird.body.velocity.y = -this.flapVelocity;
    }

    increaseScore(){
        this.score += 1;
        this.scoreText.setText(`Score: ${this.score}`);
    }

    setBestScore(){
        const bestScoreText = localStorage.getItem('bestScore');
        const bestScore = bestScoreText && parseInt(bestScoreText, 10);

        if(!bestScore || this.score > bestScore){
            localStorage.setItem('bestScore', this.score);
        }
    }
      
    gameOver(){
        // this.bird.x = this.config.startPosition.x;
        // this.bird.y = this.config.startPosition.y;
        // this.bird.body.velocity.y = 0;
        this.physics.pause();
        this.bird.setTint(0xfc030f);
        this.setBestScore();
        
        this.time.addEvent({
            delay: 1000,
            callback: () =>{
                this.scene.restart();
            },
            loop: false,
        })
    }
}

export default PlayScene;