import Card from './Card.js';
import Game from './Game.js';
import TaskQueue from './TaskQueue.js';
import SpeedRate from './SpeedRate.js';

// Отвечает является ли карта уткой.
function isDuck(card) {
    return card && card.quacks && card.swims;
}

// Отвечает является ли карта собакой.
function isDog(card) {
    return card instanceof Dog;
}

// Дает описание существа по схожести с утками и собаками
function getCreatureDescription(card) {
    if (isDuck(card) && isDog(card)) {
        return 'Утка-Собака';
    }
    if (isDuck(card)) {
        return 'Утка';
    }
    if (isDog(card)) {
        return 'Собака';
    }
    return 'Существо';
}



//3
class Creature extends Card {
    constructor(name, maxPower, image) {
        super(name, maxPower, image);
        this._currentPower = maxPower;
    }

    get currentPower() {
        return this._currentPower;
    }

   set currentPower(value) {
        this._currentPower = Math.min(value, this.maxPower);
    }

    getDescriptions() {
        return [getCreatureDescription(this), ...super.getDescriptions()];
    }
}


// Класс Duck, унаследованный от Card
class Duck extends Creature {
    constructor(name = 'Мирная утка', maxPower = 2, image) {
        super(name, maxPower, image);
    }

    quacks() {
        console.log('quack');
    }

    swims() {
        console.log('float: both;');
    }
}

// Класс Dog, унаследованный от Card
class Dog extends Creature {
    constructor(name = 'Пес-бандит', maxPower = 3, image) {
        super(name, maxPower, image);
    }
}

class Brewer extends Duck {
    constructor(name = 'Пивовар', maxPower = 2, image) {
        super(name, maxPower, image);
    }
    doBeforeAttack(gameContext, continuation) {
        const { currentPlayer, oppositePlayer } = gameContext;
        const allCards = currentPlayer.table.concat(oppositePlayer.table);
        allCards.forEach(card => {
            if (isDuck(card)) {
                card.maxPower += 1;
                card.currentPower += 2;
                card.view.signalHeal(() => {
                    card.updateView();
                });
            }
        });

        super.doBeforeAttack(gameContext, continuation);
    }
}

class Lad extends Dog {
    constructor(name = 'Браток', maxPower = 2, image) {
        super(name, maxPower, image);
    }

    static getInGameCount() {
        return this.inGameCount || 0;
    }

    static setInGameCount(value) {
        this.inGameCount = value;
    }

    static getBonus() {
        const count = this.getInGameCount();
        return count * (count + 1) / 2;
    }

    doAfterComingIntoPlay(gameContext, continuation) {
        Lad.setInGameCount(Lad.getInGameCount() + 1);
        super.doAfterComingIntoPlay(gameContext, continuation);
    }

    doBeforeRemoving(continuation) {
        Lad.setInGameCount(Lad.getInGameCount() - 1);
        super.doBeforeRemoving(continuation);
    }

    modifyDealedDamageToCreature(value, toCard, gameContext, continuation) {
        const bonus = Lad.getBonus();
        continuation(value + bonus);
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        const bonus = Lad.getBonus();
        continuation(Math.max(value - bonus, 0));
    }

    getDescriptions() {
        const descriptions = [];
        if (Lad.prototype.hasOwnProperty('modifyDealedDamageToCreature') || Lad.prototype.hasOwnProperty('modifyTakenDamage')) {
            descriptions.push('Чем их больше, тем они сильнее');
        }
        return [...descriptions, ...super.getDescriptions()];
    }
}

class Rogue extends Creature {
    constructor(name = 'Изгой', maxPower = 2, image) {
        super(name, maxPower, image);
    }

    stealAbilities(targetCard, gameContext) {
        const targetPrototype = Object.getPrototypeOf(targetCard);
        const abilities = ['modifyDealedDamageToCreature', 'modifyDealedDamageToPlayer', 'modifyTakenDamage'];

        abilities.forEach(ability => {
            if (targetPrototype.hasOwnProperty(ability)) {
                this[ability] = targetPrototype[ability];
                delete targetPrototype[ability];
                gameContext.updateView();
            }
        });
    }

    doBeforeAttack(gameContext, continuation) {
        const { oppositePlayer, position } = gameContext;
        const targetCard = oppositePlayer.table[position];

        if (targetCard) {
            this.stealAbilities(targetCard, gameContext);
        }

        super.doBeforeAttack(gameContext, continuation);
    }
}

// Колода Шерифа, нижнего игрока.

// 5 gatling
class Gatling extends Creature{
    constructor(name = 'Гатлинг', maxPower = 6, image) {
        super(name, maxPower, image);
    }
    attack(gameContext, continuation) {
        const taskQueue = new TaskQueue();

        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;
        
        for (const oppositeCard of oppositePlayer.table) {
            if (!oppositeCard) {
                continue;
            }
            taskQueue.push(onDone => this.view.showAttack(onDone));
            taskQueue.push(onDone => {
                this.dealDamageToCreature(this.currentPower, oppositeCard, gameContext, onDone);
            });
        }
        taskQueue.continueWith(continuation);

    }
}

class Trasher extends Dog {
    constructor(name = 'Громила', maxPower = 5, image){
        super(name, maxPower, image);
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        const reducedValue = Math.max(value - 1, 0);
        this.view.signalAbility(() => {
            continuation(reducedValue);
        });
    }

    getDescriptions() {
        return [
            'Получает на 1 меньше урона при атаке',
            ...super.getDescriptions(),
        ];
    }
}


const seriffStartDeck = [
    new Duck(),
    new Brewer(),
];

// Колода Бандита, верхнего игрока.
const banditStartDeck = [
    new Dog(),
    new Dog(),
    new Dog(),
    new Dog(),
];

// Создание игры.
const game = new Game(seriffStartDeck, banditStartDeck);

// Глобальный объект, позволяющий управлять скоростью всех анимаций.
SpeedRate.set(1);

// Запуск игры.
game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});
