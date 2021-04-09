// ==UserScript==
// @name         CSGOEmpire Bet Script
// @namespace    https://raw.githubusercontent.com/santos-samuel/BetAnalyser/master/script.js
// @version      0.1
// @description  Good luck!
// @author       Samuel Santos
// @match        http://csgoempire.com/
// @icon         https://www.google.com/s2/favicons?domain=tampermonkey.net
// @grant        none
// ==/UserScript==

const DICE_RES = "DICE_RES"
const T_RES = "T_RES"
const CT_RES = "CT_RES"
const DICE_COIN_CLASS = "coin-bonus";
const CT_COIN_CLASS = "coin-ct";
const T_COIN_CLASS = "coin-t";
const STATUS_START = "STATUS_START"
const STATUS_STOP = "STATUS_STOP"

const STRATEGY_MARTINGALE = "MARTINGALE_STRAT";
const STRATEGY_DICE = "DICE_STRAT";

const DEBUG = false;

const WAIT_BEFORE_BET_TIME = 7;

const globalContext = {}
globalContext.status = STATUS_STOP;
globalContext.lastBetValue = -1;
globalContext.lastBetCoin = null;
globalContext.baseBet = 0.01;
globalContext.waitStreak = 40;
globalContext.potentialReturn = -1;
globalContext.potentialProfit = -1;
globalContext.initialBalance = -1;
globalContext.increaseBy = 1.07; // dice only

// globalContext.lastCT = 10;
// globalContext.lastT = 10;
// globalContext.lastDice = 10;
globalContext.activeStrategy = STRATEGY_DICE;

let PAST_10_RESULTS_DIV;
let CT_BET_BUTTON;
let T_BET_BUTTON;
let DICE_BET_BUTTON;
let ROLLING_TIMER_TEXT_DIV;
let BET_AMOUNT_INPUT;
let BALANCE_WRAPPER;


async function performBet(newBetValue, coin) {
    var event = new Event('input', {
        'bubbles': true,
        'cancelable': true
    });

    BET_AMOUNT_INPUT.focus();
    await sleep(200);
    BET_AMOUNT_INPUT.value = newBetValue;
    await sleep(200);
    BET_AMOUNT_INPUT.dispatchEvent(event);
    await sleep(200);
    BET_AMOUNT_INPUT.blur();
    await sleep(200);

    globalContext.lastBetValue = newBetValue;
    globalContext.lastBetCoin = coin;

    const previousBalance = getBalance();

    if (coin === CT_RES) {
        CT_BET_BUTTON.click();
    } else if (coin === T_RES) {
        T_BET_BUTTON.click();
    } else if (coin === DICE_RES) {
        DICE_BET_BUTTON.click();
    }

    if (!DEBUG) {
        const afterBalance = getBalance();

        if (afterBalance >= previousBalance) {
            console.log("ERROR - Bet not made successfully? Balance did not change!")
            document.getElementById("bet-countdown").innerText = "ERROR!";
            handleBettorStop();
            return;
        }
    }

    document.getElementById("bet-countdown").innerText = "Bet done. Good luck!";
}

function preBet(newBetValue, coin) {
    function afterTimeout() {
        if (globalContext.status === STATUS_STOP) {
            console.log("Abort by the user. Not betting.")
            document.getElementById("bet-countdown").innerText = "Aborted by the user. Not betting.";
            return;
        } else {
            performBet(newBetValue, coin);
        }
    }

    function countdownBet(countDown) {
        if(countDown === 0) {
            afterTimeout()
            return;
        }
        else {
          document.getElementById("bet-countdown").innerText = countDown;
          setTimeout(() => countdownBet(countDown - 1), 1000)
        }
    }

    console.log("Betting " + newBetValue + " on " + coin + " in " + WAIT_BEFORE_BET_TIME + " seconds...")

    document.getElementById("bet-round").innerText = globalContext.betRound;
    document.getElementById("bet-amount").innerText = newBetValue;
    document.getElementById("bet-coin").innerText = coin;
    document.getElementById("bet-accumulated-amount").innerText = globalContext.betAccumulatedAmount;
    document.getElementById("bet-potentialReturn").innerText = globalContext.potentialReturn;
    document.getElementById("bet-potentialProfit").innerText = globalContext.potentialProfit;

    countdownBet(WAIT_BEFORE_BET_TIME);
}

function handleNextDecision() {
    const baseBet = globalContext.baseBet;
    const waitStreak = globalContext.waitStreak;
    const increaseBy = globalContext.increaseBy;

    if (globalContext.activeStrategy === STRATEGY_MARTINGALE) {
        const lastCT = globalContext.lastCT;
        const lastT = globalContext.lastT;
        if (lastCT >= waitStreak || lastT >= waitStreak) {
            let betCoin;
            if (globalContext.lastBetCoin != null) {
              betCoin = globalContext.lastBetCoin;
            } else {
              betCoin = (lastCT >= waitStreak ? CT_RES : T_RES)
              console.log(betCoin + " last outcome >= " + waitStreak);
            }

            if (globalContext.lastBetValue < 0) {
                globalContext.betRound = 1;
                globalContext.betAccumulatedAmount = baseBet;
                globalContext.potentialReturn = baseBet * 2;
                globalContext.potentialProfit = parseFloat((globalContext.potentialReturn - globalContext.betAccumulatedAmount).toFixed(2));
                globalContext.initialBalance = getBalance();
                preBet(baseBet, betCoin)
            } else {
                globalContext.betRound += 1;
                globalContext.betAccumulatedAmount += globalContext.lastBetValue * 2;
                globalContext.potentialReturn = globalContext.lastBetValue * 2 * 2;
                globalContext.potentialProfit = parseFloat((globalContext.potentialReturn - globalContext.betAccumulatedAmount).toFixed(2));
                preBet(globalContext.lastBetValue * 2, betCoin)
            }
        }
    }
    else if (globalContext.activeStrategy === STRATEGY_DICE) {
        const lastDice = globalContext.lastDice;
        if (lastDice >= waitStreak) {
            if (globalContext.lastBetCoin == null) { // first bet
                const betCoin = DICE_RES;
                console.log(betCoin + " last outcome >= " + waitStreak);

                globalContext.betRound = 1;
                globalContext.betAccumulatedAmount = baseBet;
                globalContext.potentialReturn = parseFloat((baseBet * 14).toFixed(2));
                globalContext.potentialProfit = parseFloat((globalContext.potentialReturn - globalContext.betAccumulatedAmount).toFixed(2));
                globalContext.initialBalance = getBalance();
                preBet(baseBet, betCoin);
            } else {
                globalContext.betRound += 1;
                let newBetAmount;

                if (parseFloat((globalContext.potentialProfit - globalContext.lastBetValue).toFixed(2)) < 0.01) {
                    newBetAmount = Math.ceil(globalContext.lastBetValue * globalContext.increaseBy * 100) / 100; // equivalent to ROUND_UP
                } else {
                    newBetAmount = globalContext.lastBetValue;
                }

                globalContext.betAccumulatedAmount = parseFloat((globalContext.betAccumulatedAmount + newBetAmount).toFixed(2));
                globalContext.potentialReturn = parseFloat((newBetAmount * 14).toFixed(2));
                globalContext.potentialProfit = parseFloat((globalContext.potentialReturn - globalContext.betAccumulatedAmount).toFixed(2));

                console.log(globalContext.betRound + " " + newBetAmount + " " + globalContext.betAccumulatedAmount + " " + globalContext.potentialProfit)
                preBet(newBetAmount, globalContext.lastBetCoin);
            }

        }
    }
}

function workOnClassAdd() {
    const coinResult = parseLastResult()
    console.log("Round ended! Outcome = ", coinResult)

    // last results update
    if (coinResult === DICE_RES) {
        globalContext.lastDice = -1;
    } else if (coinResult === T_RES) {
        globalContext.lastT = -1;
    } else if (coinResult === CT_RES) {
        globalContext.lastCT = -1;
    }

    globalContext.lastDice += 1;
    globalContext.lastT += 1;
    globalContext.lastCT += 1;

    redrawLastResults();

    if (globalContext.status === STATUS_START) {
        if (globalContext.lastBetCoin == null) {
            // do nothing, bet not performed yet
        } else {
            // process result
            if (globalContext.lastBetCoin === coinResult) {
                console.log("Bet won! Reset!")
                globalContext.lastBetValue = -1;
                globalContext.lastBetCoin = null;

                if (!DEBUG) {
                    const afterBalance = getBalance();
                    if (globalContext.initialBalance + globalContext.potentialProfit !== afterBalance) {
                      console.log("ERROR - Balance not incremented after winning bet?")
                      handleBettorStop();
                    }
                }

                document.getElementById("bet-round").innerText = "-";
                document.getElementById("bet-amount").innerText = "-";
                document.getElementById("bet-coin").innerText = "-";
                document.getElementById("bet-accumulated-amount").innerText = "-";
                document.getElementById("bet-countdown").innerText = "-";
                document.getElementById("bet-potentialReturn").innerText = "-";
                document.getElementById("bet-potentialProfit").innerText = "-";
            }
        }

        handleNextDecision();
    }
}

function workOnClassRemoval() {
}

function handleBettorStart() {
    const waitStreakInput = document.getElementById("betWaitStreak")
    const baseBetInput = document.getElementById("baseBet")
    const increaseByInput = document.getElementById("increaseBy")
    const waitStreak = parseInt(waitStreakInput.value)
    const baseBet = parseFloat(baseBetInput.value)
    const increaseBy = parseFloat(increaseByInput.value)

    if (isNaN(waitStreak) || waitStreak <= 0 || isNaN(baseBet) || baseBet <= 0 || isNaN(increaseBy) || increaseBy <= 0) {
        alert("Error: Invalid input!")
        return;
    }

    globalContext.baseBet = baseBet;
    globalContext.waitStreak = waitStreak;
    globalContext.increaseBy = increaseBy;

    if (globalContext.activeStrategy == null) {
        alert("No strategy selected!")
        return;
    }

    console.log("Starting Auto-Bettor")
    globalContext.status = STATUS_START;

    updateSelectedOptions();

    const countDownValue = ROLLING_TIMER_TEXT_DIV.innerText;
    if (parseFloat(countDownValue) >= WAIT_BEFORE_BET_TIME + 1) {
        console.log("Starting now!")
        handleNextDecision();
    } else {
        console.log("Starting on next roll!")
    }
}

function handleBettorStop() {
    if (globalContext.status === STATUS_STOP) {
        return;
    }

    console.log("Stopping Auto-Bettor!")
    globalContext.status = STATUS_STOP;
    globalContext.lastBetValue = -1;
    globalContext.lastBetCoin = null;
    globalContext.potentialReturn = -1;
    globalContext.potentialProfit = -1;
    globalContext.initialBalance = -1;


    const waitStreakInput = document.getElementById("betWaitStreak")
    const baseBetInput = document.getElementById("baseBet")
    const increaseByInput = document.getElementById("increaseBy")
    waitStreakInput.value = "";
    baseBetInput.value = "";
    increaseByInput.value = "";

    document.getElementById("selected-options-status").innerText = globalContext.status;
    document.getElementById("selected-options-strategy").innerText = "-";
    document.getElementById("selected-options-basebet").innerText = "-";
    document.getElementById("selected-options-waitstreak").innerText = "-";
    document.getElementById("selected-options-increaseBy").innerText = "-";

    document.getElementById("bet-round").innerText = "-";
    document.getElementById("bet-amount").innerText = "-";
    document.getElementById("bet-coin").innerText = "-";
    document.getElementById("bet-accumulated-amount").innerText = "-";
    document.getElementById("bet-potentialReturn").innerText = "-";
    document.getElementById("bet-potentialProfit").innerText = "-";
}



function initLastResults() {
    const pastRolls = PAST_10_RESULTS_DIV.getElementsByClassName("previous-rolls-item");

    let lastDice = 0;
    let lastT = 0;
    let lastCT = 0;

    for (let i = 0; i < pastRolls.length; i++) {
        const iResult = parseResult(pastRolls[i].children[0].className);
        if (iResult === DICE_RES) {
            lastDice = -1;
        } else if (iResult === T_RES) {
            lastT = -1;
        } else if (iResult === CT_RES) {
            lastCT = -1;
        }

        lastDice += 1;
        lastT += 1;
        lastCT += 1;
    }

    globalContext.lastDice = lastDice;
    globalContext.lastT = lastT;
    globalContext.lastCT = lastCT;

    redrawLastResults();
}

function run() {
    const countDownDiv = document.getElementsByClassName("wheel__item absolute w-full h-full flex items-center justify-center z-20")[0];
    const watcher = new ClassWatcher(countDownDiv, "wheel__item--visible", workOnClassAdd, workOnClassRemoval)
}

(function() {
    setTimeout(async () => {
       if (!safeguardVerification()) {
           return false;
       }
       else {
           console.log("Let's go!")

           drawMenu()
           initLastResults();

           run();

           // if (DEBUG) {
           //  const waitStreakInput = document.getElementById("betWaitStreak")
           //  const baseBetInput = document.getElementById("baseBet")
           //  const increaseByInput = document.getElementById("increaseBy")
           //  baseBetInput.value = 0.01;
           //  waitStreakInput.value = 1;
           //  increaseByInput.value = 1.07;
           //  handleBettorStart();
           //  for (var i = 121 - 1; i >= 0; i--) {
           //      await sleep(1000)
           //      workOnClassAdd();
           //      workOnClassRemoval();
           //  }
           // }

           document.addEventListener('click',function(e){
               if(e.target && e.target.id == 'automated-start'){
                   handleBettorStop();
                   handleBettorStart();
               }
               else if(e.target && e.target.id == 'automated-stop'){
                   handleBettorStop();
               }
               else if(e.target && e.target.id == 'btnMartingale'){
                   handleBettorStop();
                   handleSelectMartingale();
               }
               else if(e.target && e.target.id == 'btnDiceStrategy'){
                   handleBettorStop();
                   handleSelectDice();
               }
           });
       }
    }, 3000);
})();

function getBalance() {
    return parseFloat(BALANCE_WRAPPER.innerText);
}

function updateSelectedOptions() {
    document.getElementById("selected-options-status").innerText = globalContext.status;
    document.getElementById("selected-options-strategy").innerText = globalContext.activeStrategy;
    document.getElementById("selected-options-basebet").innerText = globalContext.baseBet;
    document.getElementById("selected-options-waitstreak").innerText = globalContext.waitStreak;
    document.getElementById("selected-options-increaseBy").innerText = globalContext.increaseBy;
}

function redrawLastResults() {
    document.getElementById("lastResultsCT").innerText = globalContext.lastCT;
    document.getElementById("lastResultsT").innerText = globalContext.lastT;
    document.getElementById("lastResultsDice").innerText = globalContext.lastDice;
}

function parseLastResult() {
    const pastRollsDivs = PAST_10_RESULTS_DIV.getElementsByClassName("previous-rolls-item");
    const lastResultDiv = pastRollsDivs[pastRollsDivs.length - 1];
    return parseResult(lastResultDiv.children[0].className)
}

function handleSelectMartingale() {
    globalContext.activeStrategy = STRATEGY_MARTINGALE;
}

function handleSelectDice() {
    globalContext.activeStrategy = STRATEGY_DICE;
}


function parseResult(clazzName) {
    if (clazzName.includes(DICE_COIN_CLASS)) {
        return DICE_RES;
    }
    else if (clazzName.includes(CT_COIN_CLASS)) {
        return CT_RES;
    }
    else if (clazzName.includes(T_COIN_CLASS)) {
        return T_RES;
    }
    else {
        alert("ERROR: PARSE RESULT")
        return;
    }
}






























function safeguardVerification() {
    // roullete check
    const wheelDiv = document.getElementsByClassName("wheel relative w-full mx-auto mb-8 lg:mb-12");
    if (wheelDiv.length !== 1) {
        return false;
    }

    // Rolling countdown check
    const timerInfo = document.getElementsByClassName("wheel__item absolute w-full h-full flex items-center justify-center z-20")
    const timerInfo2 = wheelDiv[0].getElementsByClassName("wheel__item absolute w-full h-full flex items-center justify-center z-20")
    if (timerInfo.length !== 1 || timerInfo2.length !== 1 || timerInfo[0] !== timerInfo2[0]) {
        return false;
    }
    const timerChildChildren = timerInfo[0].children[0].children;
    if (timerChildChildren.length !== 2 || timerChildChildren[0].innerText !== "ROLLING" || isNaN(parseFloat(timerChildChildren[1].innerText))) {
        return false;
    }

    ROLLING_TIMER_TEXT_DIV = timerChildChildren[1];


    // Verify past rolls
    const pastRollsDiv1 = document.getElementsByClassName("hidden lg:flex items-center justify-center mb-5");
    if (pastRollsDiv1.length !== 1) {
        return false;
    }
    const pastRollsDiv2 = pastRollsDiv1[0].getElementsByClassName("flex relative h-24");
    if (pastRollsDiv2.length !== 1) {
        return false;
    }

    if (pastRollsDiv2[0].children.length !== 10) {
        return false;
    }
    for (var i = pastRollsDiv2[0].children.length - 1; i >= 0; i--) {
        const pastResult = pastRollsDiv2[0].children[i];
        if (pastResult.className !== "previous-rolls-item") {
            return false;
        }
        if (pastResult.children.length !== 1) {
            return false;
        }
        const coinDivClassName = pastResult.children[0].className
        if (!coinDivClassName.includes("inline-block w-24 h-24 rounded-full ml-1")) {
            return false;
        }
        if (!coinDivClassName.includes(CT_COIN_CLASS) && !coinDivClassName.includes(T_COIN_CLASS) && !coinDivClassName.includes(DICE_COIN_CLASS)) {
            return false;
        }
    }


    PAST_10_RESULTS_DIV = pastRollsDiv2[0];


    // verify bet value input
    const betDiv = document.getElementsByClassName("bet-input__field");
    if (betDiv.length !== 1) {
        return false;
    }
    const inputDivs = betDiv[0].getElementsByTagName('input');
    if (inputDivs.length !== 1) {
        return false;
    }
    const betInput = inputDivs[0];
    if (betInput.placeholder !== "Enter bet amount...") {
        return false;
    }

    BET_AMOUNT_INPUT = betInput;

    // Verify bet buttons
    const buttonsWrapper = document.getElementsByClassName("bet-buttons w-full mb-1 lg:mb-0");
    if (buttonsWrapper.length !== 1 || buttonsWrapper[0].children.length !== 3) {
        return false;
    }
    const betButtons = buttonsWrapper[0].getElementsByClassName("bet-btn");
    if (betButtons.length !== 3) {
        return false;
    }
    for (var j = betButtons.length - 1; j >= 0; j--) {
        const btn = betButtons[j];
        if (btn.tagName !== "BUTTON" || btn.children[0].className !== "bet-btn__image") {
            return false;
        }
    }

    const ctButton = betButtons[0];
    const diceButton = betButtons[1];
    const tButton = betButtons[2];

    if (!ctButton.children[0].src.includes(CT_COIN_CLASS) || !diceButton.children[0].src.includes(DICE_COIN_CLASS) || !tButton.children[0].src.includes(T_COIN_CLASS)) {
        return false;
    }

    CT_BET_BUTTON = ctButton;
    T_BET_BUTTON = tButton;
    DICE_BET_BUTTON = diceButton;

    // interface before location
    const betInputs = document.getElementsByClassName('bet-input lg:flex lg:justify-center mb-4 lg:mb-5')
    if (betInputs.length !== 1) {
        return;
    }

    // balance
    const parentBalanceDiv = document.getElementsByClassName('layout')
    if (parentBalanceDiv.length !== 1) {
        return;
    }

    const balanceDiv = parentBalanceDiv[0].getElementsByClassName("balance")
    if (balanceDiv.length !== 1) {
        return;
    }
    if (balanceDiv[0].children.length !== 2) {
        return false;
    }
    const balanceSpan = balanceDiv[0].children[1];
    if (balanceSpan.tagName !== "SPAN") {
        return false;
    }
    const balanceInner = balanceSpan.getElementsByClassName("whitespace-no-wrap font-numeric");
    if (balanceInner.length !== 1) {
        return;
    }

    BALANCE_WRAPPER = balanceInner[0];

    if (isNaN(parseFloat(balanceInner[0].innerText))) {
        return false;
    }

    return true;
}




function insertAfter(referenceNode, newNode) {
  referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function drawMenu() {
    var menu = document.createElement('div');
    menu.innerHTML = `
        <div id="bettor-menu">
          <div style="display: flex; flex-direction: row;">
            <div style="display: flex; flex: 1; flex-direction: column;">

              <div class="entryWrapper">
                <label class="title">Status:</label>
                <div style="flex-direction: row;">
                  <button type="button" class="btn btn-success" id="automated-start">Start</button>
                  <button type="button" class="btn btn-warning" id="automated-stop">Stop</button>
                </div>
              </div>

              <div class="entryWrapper">
                <label class="title">Strategy:</label>
                <div style="flex-direction: row;">
                  <button type="button" class="btn btn-default" id="btnMartingale"> T/CT Betting </button>
                  <button type="button" class="btn btn-default" id="btnDiceStrategy"> Dice Betting </button>
                </div>
              </div>

              <div class="entryWrapper">
                <label class="title">Settings:</label>
                <div style="flex-direction: row;">
                  <div class="input-group-addon"> Number of times until bet </div>
                  <input type="number" class="inputText" placeholder="" id="betWaitStreak">

                  <div class="input-group-addon">Base value</div>
                  <input type="number" step="0.01" class="inputText" placeholder="Base bet" id="baseBet">

                  <div class="input-group-addon">Increase by (dice only)</div>
                  <input type="number" step="0.01" class="inputText" placeholder="1.07" id="increaseBy">
                </div>
              </div>
            </div>

            <div style="display: flex; flex: 1; flex-direction: column;">
              <div class="entryWrapper" id="lastResults">
                <label class="title">Rounds after last coin:</label>
                <p><b>Last CT:</b> <span id="lastResultsCT"> ${globalContext.lastCT} </span></p>
                <p><b>Last T:</b> <span id="lastResultsT"> ${globalContext.lastT} </span></p>
                <p><b>Last Dice:</b> <span id="lastResultsDice"> ${globalContext.lastDice} </span></p>
              </div>

              <div class="entryWrapper">
                <label class="title">Selected options:</label>
                <p><b>Status:</b> <span id="selected-options-status"> ${globalContext.status} </span></p>
                <p><b>Strategy:</b> <span id="selected-options-strategy"> - </span></p>
                <p><b>Base bet:</b> <span id="selected-options-basebet"> - </span></p>
                <p><b>Wait Streak:</b> <span id="selected-options-waitstreak"> - </span></p>
                <p><b>Increase By:</b> <span id="selected-options-increaseBy"> - </span></p>
              </div>

              <div class="entryWrapper">
                <p><b>Bet round:</b> <span id="bet-round"> - </span></p>
                <p><b>Bet amount:</b> <span id="bet-amount"> - </span></p>
                <p><b>Bet coin:</b> <span id="bet-coin"> - </span></p>
                <p><b>Accumulated amount:</b> <span id="bet-accumulated-amount"> - </span></p>
                <p><b>Potential Return:</b> <span id="bet-potentialReturn"> - </span></p>
                <p><b>Potential Profit:</b> <span id="bet-potentialProfit"> - </span></p>
                <p><b>Performing bet in ... </b> <span id="bet-countdown"> - </span></p>
              </div>
            </div>
          </div>
        </div>
    `;

    var style;
var css = `
    #bettor-menu{background:#141419;}
    .entryWrapper {
      flex-direction: column;
      margin-bottom: 15px;
    }
    .btn {
      background-color: #4CAF50; /* Green */
      border: none;
      color: white;
      padding: 8px 18px;
      text-align: center;
      text-decoration: none;
      display: inline-block;
      font-size: 16px;
    }

    .btn-warning {
      background-color: red;
    }
    .title {
      font-weight: bolder;
      font-size: 18px;
    }
    .inputText {
      color: black!important;
    }
`;
    style = document.getElementById('automated-style');
    if (!style) {
        var head;
        head = document.getElementsByTagName('head')[0];
        if (!head) { return; }
        style = document.createElement('style');
        style.type = 'text/css';
        style.id = 'automated-style';
        style.innerHTML = css;
        head.appendChild(style);
    }
    style.innerHTML = css;

    insertAfter(document.getElementsByClassName('bet-input lg:flex lg:justify-center mb-4 lg:mb-5')[0], menu);
}


class ClassWatcher {

    constructor(targetNode, classToWatch, classAddedCallback, classRemovedCallback) {
        this.targetNode = targetNode
        this.classToWatch = classToWatch
        this.classAddedCallback = classAddedCallback
        this.classRemovedCallback = classRemovedCallback
        this.observer = null
        this.lastClassState = targetNode.classList.contains(this.classToWatch)

        this.init()
    }

    init() {
        this.observer = new MutationObserver(mutationsList => {
            for(let mutation of mutationsList) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    let currentClassState = mutation.target.classList.contains(this.classToWatch)
                    if(this.lastClassState !== currentClassState) {
                        this.lastClassState = currentClassState
                        if(currentClassState) {
                            this.classAddedCallback()
                        }
                        else {
                            this.classRemovedCallback()
                        }
                    }
                }
            }
        })
        this.observe()
    }

    observe() {
        this.observer.observe(this.targetNode, { attributes: true })
    }

    disconnect() {
        this.observer.disconnect()
    }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
