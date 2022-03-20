import { useState } from 'react';
import { ethers } from 'ethers';
import './App.css';
import Greeter from './artifacts/contracts/Greeter.sol/Greeter.json'
import Token from './artifacts/contracts/Token.sol/Token.json'

import * as PIXI from 'pixi.js';
import { KawaseBlurFilter } from '@pixi/filter-kawase-blur';
import SimplexNoise from 'simplex-noise';
import hsl from 'hsl-to-hex';
import debounce from 'debounce';


const tokenAddress = "0x7f337ad85aab6b6de5ac4332b7572cd77a4d1237"

function App() {
  const [userAccount, setUserAccount] = useState('')
  const [amount1, setAmount] = useState()
  var amount = amount1 * 1000000000000000;
  async function requestAccount() {
      await window.ethereum.request({ method: 'eth_requestAccounts' })
    }
  async function getBalance() {
    if (typeof window.ethereum !== 'undefined') {
      const [account] = await window.ethereum.request({method: 'eth_requestAccounts' })
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(tokenAddress, Token.abi, provider)
      const balance = await contract.balanceOf(account);
      console.log("Balance: ", balance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
      window.alert("Your STC Balance: " + balance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
    }
  }
  async function sendCoins() {
    if (typeof window.ethereum !== 'undefined') {
      await requestAccount()
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(tokenAddress, Token.abi, signer);
      const transaction = await contract.transfer(userAccount, amount);
      await transaction.wait();
      console.log('${amount} Coins successfully sent to ${userAccount}');
    }
  }

  function random(min, max) {
    return Math.random() * (max - min) + min;
  }

  function map(n, start1, end1, start2, end2) {
    return ((n - start1) / (end1 - start1)) * (end2 - start2) + start2;
  }

  const simplex = new SimplexNoise();

  class ColorPalette {
    constructor() {
      this.setColors();
      this.setCustomProperties();
    }

    setColors() {
      this.hue = ~~random(220, 360);
      this.complimentaryHue1 = this.hue + 30;
      this.complimentaryHue2 = this.hue + 60;
      this.saturation = 95;
      this.lightness = 50;

      this.baseColor = hsl(this.hue, this.saturation, this.lightness);
      this.complimentaryColor1 = hsl(
        this.complimentaryHue1,
        this.saturation,
        this.lightness
      );
      this.complimentaryColor2 = hsl(
        this.complimentaryHue2,
        this.saturation,
        this.lightness
      );

      this.colorChoices = [
        this.baseColor,
        this.complimentaryColor1,
        this.complimentaryColor2
      ];
    }

    randomColor() {
      return this.colorChoices[~~random(0, this.colorChoices.length)].replace(
        "#",
        "0x"
      );
    }

    setCustomProperties() {
      document.documentElement.style.setProperty("--hue", this.hue);
      document.documentElement.style.setProperty(
        "--hue-complimentary1",
        this.complimentaryHue1
      );
      document.documentElement.style.setProperty(
        "--hue-complimentary2",
        this.complimentaryHue2
      );
    }
  }

  class Orb {
    constructor(fill = 0x000000) {
      this.bounds = this.setBounds();
      this.x = random(this.bounds["x"].min, this.bounds["x"].max);
      this.y = random(this.bounds["y"].min, this.bounds["y"].max);

      this.scale = 1;

      this.fill = fill;

      this.radius = random(window.innerHeight / 6, window.innerHeight / 3);

      this.xOff = random(0, 1000);
      this.yOff = random(0, 1000);
      this.inc = 0.002;

      this.graphics = new PIXI.Graphics();
      this.graphics.alpha = 0.825;

      window.addEventListener(
        "resize",
        debounce(() => {
          this.bounds = this.setBounds();
        }, 250)
      );
    }

    setBounds() {
      const maxDist =
        window.innerWidth < 1000 ? window.innerWidth / 3 : window.innerWidth / 5;
      const originX = window.innerWidth / 1.25;
      const originY =
        window.innerWidth < 1000
          ? window.innerHeight
          : window.innerHeight / 1.375;

      return {
        x: {
          min: originX - maxDist,
          max: originX + maxDist
        },
        y: {
          min: originY - maxDist,
          max: originY + maxDist
        }
      };
    }

    update() {
      const xNoise = simplex.noise2D(this.xOff, this.xOff);
      const yNoise = simplex.noise2D(this.yOff, this.yOff);
      const scaleNoise = simplex.noise2D(this.xOff, this.yOff);

      this.x = map(xNoise, -1, 1, this.bounds["x"].min, this.bounds["x"].max);
      this.y = map(yNoise, -1, 1, this.bounds["y"].min, this.bounds["y"].max);
      this.scale = map(scaleNoise, -1, 1, 0.5, 1);

      this.xOff += this.inc;
      this.yOff += this.inc;
    }

    render() {
      this.graphics.x = this.x;
      this.graphics.y = this.y;
      this.graphics.scale.set(this.scale);

      this.graphics.clear();

      this.graphics.beginFill(this.fill);
      this.graphics.drawCircle(0, 0, this.radius);
      this.graphics.endFill();
    }
  }

  const app = new PIXI.Application({
    view: document.querySelector(".orb-canvas"),
    resizeTo: window,
    transparent: true
  });

  const colorPalette = new ColorPalette();

  app.stage.filters = [new KawaseBlurFilter(30, 10, true)];

  const orbs = [];

  for (let i = 0; i < 10; i++) {
    const orb = new Orb(colorPalette.randomColor());

    app.stage.addChild(orb.graphics);

    orbs.push(orb);
  }

  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    app.ticker.add(() => {
      orbs.forEach((orb) => {
        orb.update();
        orb.render();
      });
    });
  } else {
    orbs.forEach((orb) => {
      orb.update();
      orb.render();
    });
  }


  return (

<div id="parent">
  <canvas class="orb-canvas"></canvas>
    <div class="overlay">
      <div class="overlay__inner">
        <h1 class="overlay__title">
          Welcome to
          <span class="text-gradient"> Stoked Coin </span>
     trade it with the tools provided below!
        </h1>
        <p class="overlay__description">
         Stoked Coin is a ERC20 Token I created to learn some basic solidity.
          <strong> Use the Ropsten Testnet and trade some now!</strong>
        </p>
          <button class="overlay__btn" onClick={getBalance}>Get Balance </button>

          <input onChange={e => setUserAccount(e.target.value)} placeholder="Recipient's Account ID" />
          <input onChange={e => setAmount(e.target.value)} placeholder="Amount" />

          <button class="overlay__btn overlay__btn--colors" onClick={sendCoins}>
            Send Coins
            <span class="overlay__btn-emoji">💰</span>
          </button>
        </div>
      </div>
  </div>
  );

  document
    .querySelector(".overlay__btn--colors")
    .addEventListener("click", () => {
      colorPalette.setColors();
      colorPalette.setCustomProperties();

      orbs.forEach((orb) => {
        orb.fill = colorPalette.randomColor();
      });
    });


}

export default App;