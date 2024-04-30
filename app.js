"use strict";

(function() {

  window.addEventListener('load', init);

  const SCRYFALL = "https://api.scryfall.com";
  const DATE = new Date();
  const DATEFORM = DATE.getFullYear() + "-" + String(DATE.getMonth() + 1).padStart(2, '0') + "-" + String(DATE.getDate()).padStart(2, '0');
  var SETS;
  var currCARDS;
  var TOTALCMC = 0;

  /**
   * the init function :)
   */
  function init(){
    id("sets").addEventListener("change", getCards);
    id("question").addEventListener("click", questionPop);
    var temp = document.getElementsByClassName("up");
    for (let item of temp) {
      item.addEventListener("click", addMana);
      item.mana = item.classList;
    }
    temp = document.getElementsByClassName("down");
    for (let item of temp) {
      item.addEventListener("click", subMana);
      item.mana = item.classList;
    }
    id("clear").addEventListener("click", clearInputs);
    id("cmcup").addEventListener("click", addCMC);
    id("cmcdown").addEventListener("click", subCMC);
    id("hideAnswer").addEventListener("click", helpHide);
    getSets();
  }
  
  /**
   * hides the help window
   */
  function helpHide() {
    id("mainCards").classList.remove("hidden");
    id("answers").classList.add("hidden");
  }

  /**
   * unhides the help window
   */
  function questionPop() {
    id("answers").classList.remove("hidden");
    id("mainCards").classList.add("hidden");
  }

  /**
   * adds one to the mana count of the mana symbol corresponding to the button, 
   * then calls repopualteCards
   * @param {button} button the button this method is assigned to
   */
  function addMana(button){ 
    id(button.currentTarget.mana[2]).innerHTML++;
    repopulateCards();
  }

  /**
   * subtracts one to the mana count of the mana symbol corresponding to the button,
   * then calls repopulateCards
   * @param {button} button the button this method is assigned to
   */
  function subMana(button){
    if (id(button.currentTarget.mana[2]).innerHTML > 0) {
      id(button.currentTarget.mana[2]).innerHTML--;
    }
    repopulateCards();
  }

  /**
   * counts the total inputted mana and records the type, then filters and populates the cards
   */
  function repopulateCards() {
    let mana = [0,0,0,0,0];
    for (let i = 0; i < document.getElementsByClassName("inputs").length; i++){
      mana[i] = document.getElementsByClassName("inputs")[i].innerHTML;
    }
    let cmc;
    if (TOTALCMC == 0){
      cmc = mana.reduce((partialSum, a) => parseInt(partialSum) + parseInt(a), 0);
    }else {
      cmc = TOTALCMC;
    }
    let cardList = []
    for (let card in currCARDS){
      let costs = currCARDS[card].costs;
      for (let cost in costs){
        if (compareCost(mana, costs[cost]) && currCARDS[card].cmc <= cmc){
          cardList.push(currCARDS[card]);
          break;
        }
      }
    }
    while (id("cards").firstChild){
      id("cards").removeChild(id("cards").firstChild);
    }
    for (let card in cardList){
      let newCard = document.createElement("img");
      newCard.classList.add("card");
      newCard.src = cardList[card].image_uris.png;
      id("cards").appendChild(newCard);
    }
  }

  /**
   * Compares available mana to a cost to determine whether or not card is "castable"
   * @param {array} mana the total mana the user has
   * @param {array} cost the cost of card
   * @returns false if there is one pip that requires more than mana has, true otherwise
   */
  function compareCost(mana, cost) {
    for (let pip in mana) {
      if (cost[pip] > mana[pip]){
        return false;
      }
    }
    return true;
  }

  /** 
   * clears all inputted mana
   */
  function clearInputs(){
    for (let inp of document.getElementsByClassName("inputs")){
      inp.innerHTML = 0;
    }
    while (id("cards").firstChild){
      id("cards").removeChild(id("cards").firstChild);
    }
    TOTALCMC = 0;
  }

  /**
   * gets the list of all sets from scryfall
   */
  function getSets(){
    let url = SCRYFALL + "/sets"
    fetch(url)
      .then(checkStatus)
      .then(resp => resp.text())
      .then(populateSets)
      .catch(handleError);
  }

  /**
   * filters out the non-expansion sets and unreleased sets, then populates the select input with the sets
   * @param {response} responseData the data from scryfall api
   */
  function populateSets(responseData){
    let setsJSON = JSON.parse(responseData);
    let sets = setsJSON.data;
    sets.sort(function(a, b) {
      return a.released_at > b.released_at;
    })
    SETS = sets;
    let setList = [];
    let setCodes = [];
    for (let i = 0; i < sets.length; i++){
      if (sets[i].set_type == "expansion" && sets[i].released_at < DATEFORM){
        setList.push(sets[i].name);
        setCodes.push(sets[i].code);
    }
    }
    for (let i = 0; i < setCodes.length; i++){
      let opt = document.createElement("option");
      opt.value = setCodes[i];
      opt.innerHTML = setCodes[i].toUpperCase();
      id("sets").appendChild(opt);
    }
  }

  /**
   * gets the cards of the set filtered by instant or flash from scryfall
   */
  function getCards(){
    let url = SCRYFALL + "/cards/search?q=%28t%3Ainstant+or+keyword%3Aflash%29+set%3A" + id("sets").value + "&unique=cards";
    fetch(url)
      .then(checkStatus)
      .then(resp => resp.text())
      .then(newCards)
      .catch(handleError);
  }

  /**
   * insert comment here
   * @param {response} responseData 
   */
  function newCards(responseData){
    currCARDS = JSON.parse(responseData).data;
    clearInputs();
    for (let card in currCARDS) {
      doManaStuff(card);
    }
  }

  /**
   * takes in a "card" as a json object and adds the different mana costs to the card. Currently ignores colorless and 
   * takes hybrid into account
   * @param {JSON object} card the card that needs different mana costs added ot it
   */
  function doManaStuff(card) {
    let mana = currCARDS[card].mana_cost;
    mana = mana.split("}");
    for (let pip in mana) {
      mana[pip] = mana[pip].replace("{", "");
    }
    let costs = permuteMana(mana);
    currCARDS[card].costs = costs;
  }

  //this needs be recursive
  //array slice figured out, now to finish all the thing.
  //take care of colors?
  /**
   * Takes in a cost and accounts for hybrid by turning the cost into an array of all possible costs.
   * @param {array} cost the default mana cost of the card. has hybrid symbols
   * @returns an array of all possible costs accounting for hybrid. Array contains int arrays that represent the manacost
   */
  function permuteMana(cost) {
    let returnThis = [];
    let disCost = [0, 0, 0, 0, 0]
    for (let pip in cost) {
      if (cost[pip].includes("/")) {
        let hybrids = cost[pip].split("/");
        let tempReturnThis = [];
        for (let pop in hybrids){
          let restpip = cost.slice(parseInt(pip) + 1, cost.length);
          restpip.push(hybrids[pop]);
          let aaaa = permuteMana(restpip);
          for (let ting in aaaa){
            for (let i = 0; i < 5; i++){
              aaaa[ting][i] += disCost[i];
            }
            returnThis.push(aaaa[ting]);
          }
        }
        return returnThis;
        //console.log(cost.slice(parseInt(pip) + 1, cost.length));
        //console.log(cost[pip].substring(2,3));
      }
      if (cost[pip] == "W") {
        disCost[0]++;
      }
      else if (cost[pip] == "U") {
        disCost[1]++;
      }
      else if (cost[pip] == "B") {
        disCost[2]++;
      }
      else if (cost[pip] == "R") {
        disCost[3]++;
      }
      else if (cost[pip] == "G") {
        disCost[4]++;
      }
    }
    returnThis.push(disCost);
    return returnThis;
  }

  /**
   * Adds one to the total cmc, then iterates the UI to match
   */
  function addCMC(){
    TOTALCMC++;
    id("CMC").innerHTML++;
  }

  /**
   * Subtracts one from the total cmc, then iterates the UI to match
   */
  function subCMC(){
    if (TOTALCMC > 0){
      TOTALCMC--;
      id("CMC").innerHTML--;
    }
  }

  /**
   * Returns the element that has the ID attribute with the specified value.
   * @param {string} idName - element ID
   * @returns {object} DOM object associated with id.
   */
   function id(idName) {
    return document.getElementById(idName);
  }

  /**
   * Returns the first element that matches the given CSS selector.
   * @param {string} selector - CSS query selector.
   * @returns {object} The first DOM object matching the query.
   */
  function qs(selector) {
    return document.querySelector(selector);
  }

  /**
   * Returns the array of elements that match the given CSS selector.
   * @param {string} selector - CSS query selector
   * @returns {object[]} array of DOM objects matching the query.
   */
  function qsa(selector) {
    return document.querySelectorAll(selector);
  }

  function checkStatus(response) {
    if (response.ok) {
      return response;
    } else {
      throw Error("Error in request: " + response.statusText);
    }
  }

  function handleError() {
    console.log("Error");
  }

})();