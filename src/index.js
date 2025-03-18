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
    getDescriptions() {
        return [getCreatureDescription(this), super.getDescriptions()];
    };
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
                this.dealDamageToCreature(2, oppositeCard, gameContext, onDone);
            });
        }
        taskQueue.continueWith(continuation);

    }

    getDescriptions() {
        return [
            'Наносит 2 урона всем картам противника',
            ...super.getDescriptions(),
        ];
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
    new Duck(),
    new Duck(),
    new Gatling(),
];
const banditStartDeck = [
    new Trasher(),
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
