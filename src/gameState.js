import { modFox, modScene, togglePoopBag, writeModal } from "./ui";
import {
  SCENES,
  RAIN_CHANCE,
  DAY_LENGTH,
  NIGHT_LENGTH,
  getNextHungerTime,
  getNextPoopTime,
  getNextDieTime,
} from "./constants";

const gameState = {
  current: "INIT",
  clock: 1,
  idleTime: -1,
  hungryTime: -1,
  timeToStartCelebrating: -1,
  timeToEndCelebrating: -1,
  poopTime: -1,
  sleepTime: -1,
  dieTime: -1,
  scene: 0,

  tick() {
    this.clock++;

    if (this.clock === this.idleTime) {
      this.idle();
    } else if (this.clock === this.hungryTime) {
      this.hunger();
    } else if (this.clock === this.timeToStartCelebrating) {
      this.startCelebrating();
    } else if (this.clock === this.timeToEndCelebrating) {
      this.endCelebrating();
    } else if (this.clock === this.poopTime) {
      this.poop();
    } else if (this.clock === this.sleepTime) {
      this.sleep();
    } else if (this.clock === this.dieTime) {
      this.die();
    }

    return this.clock;
  },

  handleUserAction(icon) {
    // can't do actions while in these states
    if (
      ["SLEEP", "FEEDING", "CELEBRATING", "HATCHING"].includes(this.current)
    ) {
      // do nothing
      return;
    }

    if (this.current === "INIT" || this.current === "DEAD") {
      this.hatch();
      return;
    }

    // execute the currently selected action
    switch (icon) {
      case "weather":
        this.changeWeather();
        break;
      case "poop":
        this.cleanUpPoop();
        break;
      case "fish":
        this.feed();
        break;
    }
  },

  determineFoxState() {
    if (this.current === "IDLING") {
      if (SCENES[this.scene] === "rain") {
        modFox("rain");
      } else {
        modFox("idling");
      }
    }
  },

  changeWeather() {
    this.scene = (1 + this.scene) % SCENES.length;
    modScene(SCENES[this.scene]);
    this.determineFoxState();
  },

  hatch() {
    this.current = "HATCHING";
    this.idleTime = this.clock + 3;
    modFox("hatching");
    modScene("day");
    writeModal();
  },

  idle() {
    this.current = "IDLING";
    this.idleTime = -1;
    this.hungryTime = getNextHungerTime(this.clock);
    this.sleepTime = this.clock + DAY_LENGTH;
    modFox("idling");
    this.scene = Math.random() > RAIN_CHANCE ? 0 : 1;
    modScene(SCENES[this.scene]);
    this.determineFoxState();
  },

  hunger() {
    this.current = "HUNGRY";
    this.hungryTime = -1;
    this.dieTime = getNextDieTime(this.clock);
    modFox("hungry");
  },

  feed() {
    // can only feed when hungry
    if (this.current !== "HUNGRY") {
      return;
    }

    this.current = "FEEDING";
    this.dieTime = -1;
    this.poopTime = getNextPoopTime(this.clock);
    this.timeToStartCelebrating = this.clock + 2;
    modFox("eating");
  },

  startCelebrating() {
    this.current = "CELEBRATING";
    this.timeToStartCelebrating = -1;
    this.timeToEndCelebrating = this.clock + 2;
    modFox("celebrating");
  },

  endCelebrating() {
    this.current = "IDLING";
    this.timeToEndCelebrating = -1;
    this.determineFoxState();
    togglePoopBag(false);
  },

  poop() {
    this.current = "POOPING";
    this.poopTime = -1;
    this.dieTime = getNextDieTime(this.clock);
    modFox("pooping");
  },

  cleanUpPoop() {
    if (this.current === "POOPING") {
      this.dieTime = -1;
      this.hungryTime = getNextHungerTime(this.clock);
      togglePoopBag(true);
      this.startCelebrating();
    }
  },

  sleep() {
    this.state = "SLEEP";
    this.clearTimes();
    this.idleTime = this.clock + NIGHT_LENGTH;
    modFox("sleeping");
    modScene("night");
  },

  die() {
    this.current = "DEAD";
    this.clearTimes();
    modScene("dead");
    modFox("dead");
    writeModal("The fox died :( <br/> Press the middle button to start");
  },

  clearTimes() {
    this.idleTime = -1;
    this.hungryTime = -1;
    this.timeToStartCelebrating = -1;
    this.timeToEndCelebrating = -1;
    this.poopTime = -1;
    this.sleepTime = -1;
    this.dieTime = -1;
  },
};

export const handleUserAction = gameState.handleUserAction.bind(gameState);
export default gameState;
