(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* global window */
'use strict';

window.Example1_startEngine = function(renderer) {
    var compo = require('./../../index');

    // Register components.
    var engine = compo.createEngine()
        // System components.
        .registerComponent('RendererComponent', require('./components/rendererComponent'))
        .registerComponent('AsteroidComponent', require('./components/asteroidComponent'))
        .registerComponent('ExplosionComponent', require('./components/explosionComponent'))
        // Player components.
        .registerComponent('PlayerBodyComponent', require('./components/playerBodyComponent'))
        .registerComponent('PlayerInputComponent', require('./components/playerInputComponent'))
        .registerComponent('PlayerActionComponent', require('./components/playerActionComponent'))
        // Bullet components.
        .registerComponent('BulletComponent', require('./components/bulletComponent'));

    engine.createEntity()
        .addComponent('PlayerBodyComponent')
        .addComponent('PlayerActionComponent')
        .addComponent('PlayerInputComponent');

    engine.createEntity('system')
        .addComponent('AsteroidComponent')
        .addComponent('ExplosionComponent')
        .addComponent('RendererComponent', {
            renderer: renderer,
            clearColor: 0xc0fae0
        });

    engine.run();
};

},{"./../../index":9,"./components/asteroidComponent":2,"./components/bulletComponent":3,"./components/explosionComponent":4,"./components/playerActionComponent":5,"./components/playerBodyComponent":6,"./components/playerInputComponent":7,"./components/rendererComponent":8}],2:[function(require,module,exports){
/* global PIXI */
'use strict';

var foreach = require('lodash.foreach');

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

function degToRad(deg) {
    return deg * Math.PI / 180;
}

var COLORS = [
    [0x380036, 0x0CBABA],
    [0xD5573B, 0x004489],
    [0x2F0A28, 0xC94277],
    [0xFF3C38, 0xFFF275],
    [0x17B2B0, 0x9000B3],
    [0x160F29, 0x3D9943]
];

module.exports = function() {
    var self = {};
    var asteroids = [];
    var spawnXRange;
    var rendererSystem;

    function createAsteroidShape(radius) {
        var color = COLORS[getRandomInt(0, COLORS.length)];
        var shapeCreators = [
            function() {
                var graphics = new PIXI.Graphics();

                graphics.lineStyle(2, color[0], 1);
                graphics.beginFill(color[1], 1);
                graphics.drawCircle(0, 0, radius);

                return graphics;
            },
            function() {
                var graphics = new PIXI.Graphics();

                var width = 1 * radius;
                var height = 1 * radius;

                graphics.lineStyle(2, color[0], 1);
                graphics.beginFill(color[1], 1);
                graphics.drawRect(0, 0, width, height);

                graphics.pivot.x = width * 0.5;
                graphics.pivot.y = height * 0.5;

                return graphics;
            },
            function() {
                var graphics = new PIXI.Graphics();

                var width = 1 * radius;
                var height = 1 * radius;

                graphics.lineStyle(2, color[0], 1);
                graphics.beginFill(color[1], 1);
                graphics.drawRoundedRect(0, 0, width, height, 4);

                graphics.pivot.x = width * 0.5;
                graphics.pivot.y = height * 0.5;

                return graphics;
            },
            function() {
                var graphics = new PIXI.Graphics();

                graphics.lineStyle(2, color[0], 1);
                graphics.beginFill(color[1], 1);

                // Hexagon.
                var points = [-1, 0, -0.5, 0.85, 0.5, 0.85, 1, 0, 0.5, -0.85, -0.5, -0.85];
                for (var i = 0; i < points.length; i++) {
                    points[i] *= radius;
                }

                graphics.drawPolygon(points);

                return graphics;
            }
        ];

        return shapeCreators[getRandomInt(0, shapeCreators.length)]();
    }

    function createAsteroid() {
        var radius = getRandomInt(10, 25);

        var display = new PIXI.DisplayObjectContainer();
        display.addChild(createAsteroidShape(radius));
        display.position.x = getRandomArbitrary(spawnXRange[0], spawnXRange[1]);
        display.position.y = -radius;
        rendererSystem.addToStage(display);

        var movementRate = getRandomArbitrary(25, 75);

        var rotationRate = getRandomArbitrary(degToRad(20), degToRad(180));
        if (getRandomInt(0, 2) === 0) {
            rotationRate = -rotationRate;
        }

        return {
            display: display,
            radius: radius,
            elapsedTime: 0,
            movementRate: movementRate,
            startXPosition: display.position.x,
            horizontalAmplitude: getRandomInt(5, 30),
            rotationRate: rotationRate
        };
    }

    self.start = function() {
        rendererSystem = self.entity.engine.findEntity('system').getComponent('RendererComponent');
        spawnXRange = [0, rendererSystem.getWindowSize().width];
    };

    var destroyAsteroid = function(asteroidIndex) {
        var asteroid = asteroids[asteroidIndex];
        rendererSystem.removeFromStage(asteroid.display);
        asteroids.splice(asteroidIndex, 1);
    };

    var asteroidSpawnInterval = 0.2;
    var elapsedTimeSinceLastSpawn = 0;

    self.update = function() {
        var dt = self.entity.engine.time.deltaTime;
        var windowSize = rendererSystem.getWindowSize();

        if (elapsedTimeSinceLastSpawn > asteroidSpawnInterval) {
            asteroids.push(createAsteroid());
            elapsedTimeSinceLastSpawn = 0;
        } else {
            elapsedTimeSinceLastSpawn += dt;
        }

        // Movement.
        for (var i = 0; i < asteroids.length; /*i++*/ ) {
            var asteroid = asteroids[i];

            var newY = asteroid.display.position.y + asteroid.movementRate * dt;

            // Prune when below bottom of screen.
            if (newY > (windowSize.height + asteroid.radius)) {
                destroyAsteroid(i);
                continue;
            }

            asteroid.display.position.x = asteroid.startXPosition + Math.sin(asteroid.elapsedTime) * asteroid.horizontalAmplitude;
            asteroid.display.position.y = newY;

            asteroid.elapsedTime += dt;

            i++;
        }

        // Rotation.
        foreach(asteroids, function(asteroid) {
            asteroid.display.rotation += asteroid.rotationRate * dt;
        });
    };

    /**
     * Check collision with the asteroids and the given x/y position.
     * Returns true if there is a collision, and destroys the asteroid.
     */
    self.checkCollision = function(x, y) {
        for (var i = 0; i < asteroids.length; i++) {
            var asteroid = asteroids[i];
            var asteroidPos = asteroid.display.position;
            var deltaX = (asteroidPos.x - x);
            var deltaY = (asteroidPos.y - y);
            var distSqr = deltaX * deltaX + deltaY * deltaY;
            var radSqr = asteroid.radius * asteroid.radius;
            if (distSqr < radSqr) {
                destroyAsteroid(i);

                var explosionSystem = self.entity.engine.findEntity('system').getComponent('ExplosionComponent');
                explosionSystem.doExplosion(asteroidPos.x, asteroidPos.y, asteroid.radius * getRandomArbitrary(0.5, 2));
                rendererSystem.doCameraShake(15 * getRandomArbitrary(0.5, 1));

                return true;
            }
        }

        return false;
    };

    return self;
};

},{"lodash.foreach":13}],3:[function(require,module,exports){
'use strict';
/* global PIXI */

var MOVE_SPEED = 120;
var SIZE = 2;

module.exports = function(param) {
    var self = {};
    var asteroidSystem;
    var rendererSystem;
    var graphics;

    self.start = function() {
        rendererSystem = self.entity.engine.findEntity('system').getComponent('RendererComponent');
        asteroidSystem = self.entity.engine.findEntity('system').getComponent('AsteroidComponent');

        graphics = new PIXI.Graphics();

        graphics.lineStyle(1, 0xFF6663, 1);
        graphics.beginFill(0x000000, 1);
        graphics.drawCircle(0, 0, SIZE);

        graphics.position.x = param.startX;
        graphics.position.y = param.startY;

        rendererSystem.addToStage(graphics);
    };

    var destroyBullet = function() {
        rendererSystem.removeFromStage(graphics);
        self.entity.destroy();
    };

    self.update = function() {
        var dt = self.entity.engine.time.deltaTime;
        var newY = graphics.position.y - MOVE_SPEED * dt;

        // Prune.
        if (newY < (0 - SIZE)) {
            destroyBullet();
            return;
        }

        // Collision.
        if (asteroidSystem.checkCollision(graphics.position.x, newY)) {
            destroyBullet();
            return;
        }

        graphics.position.y = newY;
    };

    return self;
};

},{}],4:[function(require,module,exports){
/* global PIXI */
'use strict';

var SCALE_RATE = 350.0;
var LIFETIME = 0.175;
var ROTATION_RATE = 500 * Math.PI / 180;

var COLORS = [
    0xFFFF00,
    0xff004d,
    0x00cfd0,
    0x2ecc71,
    0x29FF32,
    0xFF5507
];

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

module.exports = function() {
    var self = {};
    var activeExplosions = [];
    var rendererSystem;

    self.start = function() {
        rendererSystem = self.entity.engine.findEntity('system').getComponent('RendererComponent');
    };

    self.update = function() {
        var dt = self.entity.engine.time.deltaTime;

        for (var i = 0; i < activeExplosions.length; /*i++*/ ) {
            var explosion = activeExplosions[i];
            var newScale = explosion.display.scale.x + SCALE_RATE * dt;
            explosion.display.scale.x = newScale;
            explosion.display.scale.y = newScale;

            // Pruning.
            if (explosion.elapsedTime >= LIFETIME) {
                activeExplosions.splice(i, 1);
                rendererSystem.removeFromStage(explosion.display);
                continue;
            }

            explosion.display.rotation += ROTATION_RATE * dt;
            explosion.elapsedTime += dt;
            i++;
        }
    };

    self.doExplosion = function(x, y, size) {
        var spokes = 8;
        var holeSize = 0.15;
        var lineWidth = 0.06;
        var deltaAngle = 2 * Math.PI / spokes;
        var graphics = new PIXI.Graphics();

        var color = COLORS[getRandomInt(0, COLORS.length)];
        for (var i = 0; i < spokes; i++) {
            graphics.lineStyle(lineWidth, color, 0.75);

            var angle = i * deltaAngle;
            var cos = Math.cos(angle);
            var sin = Math.sin(angle);
            graphics.moveTo(holeSize * cos, holeSize * sin);
            graphics.lineTo(cos, sin);
        }

        graphics.pivot.x = 0.5;
        graphics.pivot.y = 0.5;

        var display = new PIXI.DisplayObjectContainer();
        display.addChild(graphics);
        display.position.x = x;
        display.position.y = y;
        display.scale.x = size;
        display.scale.y = size;
        rendererSystem.addToStage(display);

        activeExplosions.push({
            display: display,
            elapsedTime: 0
        });
    };

    return self;
};

},{}],5:[function(require,module,exports){
'use strict';

var MOVE_SPEED = 200;

module.exports = function() {
    var self = {};
    var bodyComponent;
    var inputComponent;

    self.start = function() {
        // Cache frequently used components.
        bodyComponent = self.entity.getComponent('PlayerBodyComponent');
        inputComponent = self.entity.getComponent('PlayerInputComponent');
    };

    var fireInterval = 0.1;
    var elapsedTimeSinceFire = 0;

    self.update = function() {
        var dx = 0;
        var dy = 0;
        var dt = self.entity.engine.time.deltaTime;
        if (inputComponent.isLeftDown()) {
            dx = -MOVE_SPEED;
        }
        if (inputComponent.isRightDown()) {
            dx = MOVE_SPEED;
        }
        if (inputComponent.isForwardKeyDown()) {
            dy = -MOVE_SPEED;
        }
        if (inputComponent.isBackwardKeyDown()) {
            dy = MOVE_SPEED;
        }

        // Shots fired! Create a bullet entity.
        if (elapsedTimeSinceFire > fireInterval) {
            if (inputComponent.isFireKeyDown()) {
                var currentPos = bodyComponent.getPosition();
                self.entity.engine.createEntity()
                    .addComponent('BulletComponent', {
                        startX: currentPos.x,
                        startY: currentPos.y - 25
                    });

                elapsedTimeSinceFire = 0;

            }
        } else {
            elapsedTimeSinceFire += dt;
        }

        // Clamp diagonal speed.
        var speed = dx * dx + dy * dy;
        if (speed > (MOVE_SPEED * MOVE_SPEED)) {
            speed = Math.sqrt(speed);
            dx = dx / speed * MOVE_SPEED;
            dy = dy / speed * MOVE_SPEED;
        }

        // Update position.
        bodyComponent.move(dx * dt, dy * dt);
    };

    return self;
};

},{}],6:[function(require,module,exports){
/* global PIXI */
'use strict';

var MIN_X = 10;
var MAX_X = 400 - MIN_X;
var MIN_Y = 20;
var MAX_Y = 295;

function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
}

module.exports = function() {
    var self = {};
    var graphics;

    self.start = function() {
        var rendererSystem = self.entity.engine.findEntity('system').getComponent('RendererComponent');

        var windowSize = rendererSystem.getWindowSize();

        graphics = new PIXI.Graphics();

        graphics.beginFill(0xF72C25);
        graphics.lineStyle(1, 0x071013, 1);
        graphics.drawPolygon([-6, 0, 6, 0, 0, -14]);

        graphics.position.x = windowSize.width * 0.5;
        graphics.position.y = MAX_Y;

        rendererSystem.addToStage(graphics);
    };

    var fromScale = 1.0;
    var toScale = 1.25;
    var elapsedScaleTime = 0;
    var totalScaleTime = 0.25;
    self.update = function() {
        var dt = self.entity.engine.time.deltaTime;

        // Scale animation.
        var scale;
        var t = elapsedScaleTime / totalScaleTime;
        if (t >= 1.0) {
            t = 1.0;
            scale = toScale;
            elapsedScaleTime = 0;

            var tmp = fromScale;
            fromScale = toScale;
            toScale = tmp;
        } else {
            elapsedScaleTime += dt;
            scale = ((1.0 - t) * fromScale) + (t * toScale);
        }

        graphics.scale.x = scale;
        graphics.scale.y = scale;
    };

    self.move = function(x, y) {
        var newX = graphics.position.x + x;
        var newY = graphics.position.y + y;

        newX = clamp(newX, MIN_X, MAX_X);
        newY = clamp(newY, MIN_Y, MAX_Y);

        graphics.position.x = newX;
        graphics.position.y = newY;
    };

    self.getPosition = function() {
        return {
            x: graphics.position.x,
            y: graphics.position.y
        };
    };

    return self;
};

},{}],7:[function(require,module,exports){
/* global document */
'use strict';

module.exports = function() {
    var self = {};
    var leftKeyDown = false;
    var rightKeyDown = false;
    var forwardKeyDown = false;
    var backwardKeyDown = false;
    var isFireButtonDown = false;

    self.start = function() {
        // Keyboard events.
        document.addEventListener('keydown', function(event) {
            switch (event.keyCode) {
                case 37:
                case 65:
                    leftKeyDown = true;
                    break;
                case 39:
                case 68:
                    rightKeyDown = true;
                    break;
                case 38:
                case 87:
                    forwardKeyDown = true;
                    break;
                case 40:
                case 83:
                    backwardKeyDown = true;
                    break;
                case 32: // spacebar
                    isFireButtonDown = true;
                    break;
            }
        }, false);
        document.addEventListener('keyup', function(event) {
            switch (event.keyCode) {
                case 37:
                case 65:
                    leftKeyDown = false;
                    break;
                case 39:
                case 68:
                    rightKeyDown = false;
                    break;
                case 38:
                case 87:
                    forwardKeyDown = false;
                    break;
                case 40:
                case 83:
                    backwardKeyDown = false;
                    break;
            }
        }, false);
    };

    self.update = function() {
        // Reset every frame.
        isFireButtonDown = false;
    };

    self.isLeftDown = function() {
        return leftKeyDown;
    };
    self.isRightDown = function() {
        return rightKeyDown;
    };
    self.isForwardKeyDown = function() {
        return forwardKeyDown;
    };
    self.isBackwardKeyDown = function() {
        return backwardKeyDown;
    };
    self.isFireKeyDown = function() {
        return isFireButtonDown;
    };

    return self;
};

},{}],8:[function(require,module,exports){
/* global PIXI */
'use strict';

module.exports = function(param) {
    var self = {};
    var renderer = param.renderer;
    var stage = new PIXI.Stage(param.clearColor);

    var rootObject = new PIXI.DisplayObjectContainer();
    stage.addChild(rootObject);

    self.getWindowSize = function() {
        return {
            width: renderer.width,
            height: renderer.height
        };
    };

    var shake = 0;
    var shakeDecay = 10.0;

    self.update = function() {
        var dt = self.entity.engine.time.deltaTime;

        // 'Camera' shake.
        if (shake > 0) {
            var x = Math.cos(Math.random());
            var y = Math.sin(Math.random());

            rootObject.position.x = x * shake;
            rootObject.position.y = y * shake;

            shake -= shakeDecay * dt;
        }

        renderer.render(stage);
    };

    self.addToStage = function(obj) {
        rootObject.addChild(obj);
    };

    self.removeFromStage = function(obj) {
        rootObject.removeChild(obj);
    };

    self.doCameraShake = function(amount) {
        shake = amount;
    };

    return self;
};

},{}],9:[function(require,module,exports){
module.exports = {
    createEngine: require('./lib/engine')
};

},{"./lib/engine":10}],10:[function(require,module,exports){
/* global window */
'use strict';

var foreach = require('lodash.foreach');

function Engine() {
    var prevTime = Date.now() / 1000;

    var time = {
        // The time in seconds it took to complete the last frame.
        deltaTime: 0,
        // The total number of frames that have passed.
        frameCount: 0
    };

    // Use requestAnimationFrame if we're running in the browser,
    // else use a fallback implementation (for running in tests).
    var loopFunc = (typeof window !== 'undefined') ?
        window.requestAnimationFrame :
        function() {
            var prev = new Date().getTime();
            return function(fn) {
                var curr = new Date().getTime();
                var ms = Math.max(0, 16 - (curr - prev));
                var req = setTimeout(fn, ms);
                prev = curr;
                return req;
            };
        }();

    /**
     * Start the engine loop.
     */
    var run = function() {
        tick();

        loopFunc(run);
    };

    /**
     * Perform a single tick of engine execution.
     * Useful for tests. Usually, Engine.run() is preferred.
     * Do not call if Engine.run() has already been called.
     */
    var tick = function() {
        var now = Date.now() / 1000;
        time.deltaTime = now - prevTime;

        // Update all entities.
        foreach(entities, function(entity) {
            entity.update();
        });

        // Destroy enemies.
        // Entity destruction is queued and processed here
        // to prevent issues when entities destroy themselves in their
        // update method.
        foreach(entitiesToDestroy, function(entity) {
            for (var i = 0; i < entities.length; i++) {
                if (entities[i] === entity) {
                    entities.splice(i, 1);
                    break;
                }
            }
        });
        entitiesToDestroy = [];

        time.frameCount += 1;
        prevTime = now;
    };

    var componentFactory = [];

    /**
     * Registers a component. All components must be registered
     * before they can be used.
     */
    var registerComponent = function(componentName, componentCreator) {
        if (!componentFactory.hasOwnProperty(componentName)) {
            componentFactory[componentName] = componentCreator;
        } else {
            console.warn('Component already registered: ' + componentName);
        }
        return this;
    };

    var createComponent = function(componentName, componentParam) {
        if (!componentFactory.hasOwnProperty(componentName)) {
            console.warn('Component not registered: ' + componentName);
            return null;
        }

        return componentFactory[componentName](componentParam);
    };

    var entities = [];
    var entitiesToDestroy = [];

    /**
     * Creates an empty entity.
     */
    var createEntity = function(name) {
        var entity = require('./entity')(this, name);
        entities.push(entity);
        return entity;
    };

    var destroyEntity = function(entity) {
        for (var i = 0; i < entities.length; i++) {
            if (entities[i] === entity) {
                entitiesToDestroy.push(entity);
                return;
            }
        }
    };

    /**
     * Find an entity by name.
     */
    var findEntity = function(entityName) {
        for (var i = 0; i < entities.length; i++) {
            if (entities[i].name === entityName) {
                return entities[i];
            }
        }
        return null;
    };

    return {
        time: time,
        tick: tick,
        run: run,

        registerComponent: registerComponent,
        createComponent: createComponent,

        createEntity: createEntity,
        destroyEntity: destroyEntity,
        findEntity: findEntity
    };
}

module.exports = function() {
    return new Engine();
};

},{"./entity":11,"lodash.foreach":13}],11:[function(require,module,exports){
'use strict';

var EventEmitter = require('events').EventEmitter;
var foreach = require('lodash.foreach');

function Entity(inEngine, inName) {
    var name = inName || '';
    var engine = inEngine;
    var components = [];
    var componentNames = [];
    var updateableComponents = [];
    var eventEmitter = new EventEmitter();

    var didCallStart = false;

    var start = function() {
        foreach(components, function(component) {
            if (typeof component.start === 'function') {
                component.start();
            }
        });

        didCallStart = true;
    };

    /**
     * Destroy entity and all attached components.
     */
    var destroy = function() {
        eventEmitter.removeAllListeners();
        engine.destroyEntity(this);
    };

    var update = function() {
        // Trigger 'start' on first update.
        if (!didCallStart) {
            start();
        }

        foreach(updateableComponents, function(component) {
            component.update();
        });
    };

    /**
     * Add a component to this entity.
     */
    var addComponent = function(componentName, componentParam) {
        var component = engine.createComponent(componentName, componentParam);
        if (component) {
            component.entity = this;
            components.push(component);
            componentNames.push(componentName);
            if (typeof component.update === 'function') {
                updateableComponents.push(component);
            }
        }
        return this;
    };

    /**
     * Gets a component by name.
     */
    var getComponent = function(componentName) {
        for (var i = 0; i < componentNames.length; i++) {
            if (componentNames[i] === componentName) {
                return components[i];
            }
        }
        return null;
    };

    /**
     * Send a signal to the entity which can be handled by a component
     * of this entity.
     */
    var sendSignal = function(signalType) {
        switch (arguments.length) {
            case 1:
                eventEmitter.emit(signalType);
                break;
            case 2:
                eventEmitter.emit(signalType, arguments[1]);
                break;
            case 3:
                eventEmitter.emit(signalType, arguments[1], arguments[2]);
                break;
            default:
                // Slowest case - for multiple arguments.
                var len = arguments.length;
                var args = new Array(len - 1);
                for (var i = 1; i < len; i++) {
                    args[i - 1] = arguments[i];
                }
                eventEmitter.emit(signalType, args);
        }
    };

    /**
     * Add a listener to handle the given signal type.
     */
    var addSignalListener = function(signalType, listener) {
        eventEmitter.addListener(signalType, listener);
    };

    /**
     * Remove a listener from handling the given signal type.
     */
    var removeSignalListener = function(signalType, listener) {
        eventEmitter.removeListener(signalType, listener);
    };

    return {
        name: name,
        engine: engine,

        destroy: destroy,
        update: update,

        addComponent: addComponent,
        getComponent: getComponent,

        sendSignal: sendSignal,
        addSignalListener: addSignalListener,
        removeSignalListener: removeSignalListener
    };
}

module.exports = function(engine, name) {
    return new Entity(engine, name);
};

},{"events":12,"lodash.foreach":13}],12:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],13:[function(require,module,exports){
/**
 * lodash 3.0.0 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.7.0 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */
var arrayEach = require('lodash._arrayeach'),
    baseEach = require('lodash._baseeach'),
    bindCallback = require('lodash._bindcallback'),
    isArray = require('lodash.isarray');

/**
 * Iterates over elements of `collection` invoking `iteratee` for each element.
 * The `iteratee` is bound to `thisArg` and invoked with three arguments;
 * (value, index|key, collection). Iterator functions may exit iteration early
 * by explicitly returning `false`.
 *
 * **Note:** As with other "Collections" methods, objects with a `length` property
 * are iterated like arrays. To avoid this behavior `_.forIn` or `_.forOwn`
 * may be used for object iteration.
 *
 * @static
 * @memberOf _
 * @alias each
 * @category Collection
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
 * @param {*} [thisArg] The `this` binding of `iteratee`.
 * @returns {Array|Object|string} Returns `collection`.
 * @example
 *
 * _([1, 2, 3]).forEach(function(n) { console.log(n); }).value();
 * // => logs each value from left to right and returns the array
 *
 * _.forEach({ 'one': 1, 'two': 2, 'three': 3 }, function(n, key) { console.log(n, key); });
 * // => logs each value-key pair and returns the object (iteration order is not guaranteed)
 */
function forEach(collection, iteratee, thisArg) {
  return (typeof iteratee == 'function' && typeof thisArg == 'undefined' && isArray(collection))
    ? arrayEach(collection, iteratee)
    : baseEach(collection, bindCallback(iteratee, thisArg, 3));
}

module.exports = forEach;

},{"lodash._arrayeach":14,"lodash._baseeach":15,"lodash._bindcallback":19,"lodash.isarray":20}],14:[function(require,module,exports){
/**
 * lodash 3.0.0 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.7.0 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */

/**
 * A specialized version of `_.forEach` for arrays without support for callback
 * shorthands or `this` binding.
 *
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns `array`.
 */
function arrayEach(array, iteratee) {
  var index = -1,
      length = array.length;

  while (++index < length) {
    if (iteratee(array[index], index, array) === false) {
      break;
    }
  }
  return array;
}

module.exports = arrayEach;

},{}],15:[function(require,module,exports){
/**
 * lodash 3.0.1 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.7.0 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */
var keys = require('lodash.keys');

/**
 * Used as the maximum length of an array-like value.
 * See the [ES spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength)
 * for more details.
 */
var MAX_SAFE_INTEGER = Math.pow(2, 53) - 1;

/**
 * The base implementation of `_.forEach` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array|Object|string} Returns `collection`.
 */
function baseEach(collection, iteratee) {
  var length = collection ? collection.length : 0;
  if (!isLength(length)) {
    return baseForOwn(collection, iteratee);
  }
  var index = -1,
      iterable = toObject(collection);

  while (++index < length) {
    if (iteratee(iterable[index], index, iterable) === false) {
      break;
    }
  }
  return collection;
}

/**
 * The base implementation of `baseForIn` and `baseForOwn` which iterates
 * over `object` properties returned by `keysFunc` invoking `iteratee` for
 * each property. Iterator functions may exit iteration early by explicitly
 * returning `false`.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @returns {Object} Returns `object`.
 */
function baseFor(object, iteratee, keysFunc) {
  var index = -1,
      iterable = toObject(object),
      props = keysFunc(object),
      length = props.length;

  while (++index < length) {
    var key = props[index];
    if (iteratee(iterable[key], key, iterable) === false) {
      break;
    }
  }
  return object;
}

/**
 * The base implementation of `_.forOwn` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Object} Returns `object`.
 */
function baseForOwn(object, iteratee) {
  return baseFor(object, iteratee, keys);
}

/**
 * Checks if `value` is a valid array-like length.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 */
function isLength(value) {
  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

/**
 * Converts `value` to an object if it is not one.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {Object} Returns the object.
 */
function toObject(value) {
  return isObject(value) ? value : Object(value);
}

/**
 * Checks if `value` is the language type of `Object`.
 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * **Note:** See the [ES5 spec](https://es5.github.io/#x8) for more details.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(1);
 * // => false
 */
function isObject(value) {
  // Avoid a V8 JIT bug in Chrome 19-20.
  // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
  var type = typeof value;
  return type == 'function' || (value && type == 'object') || false;
}

module.exports = baseEach;

},{"lodash.keys":16}],16:[function(require,module,exports){
/**
 * lodash 3.0.4 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */
var isArguments = require('lodash.isarguments'),
    isArray = require('lodash.isarray'),
    isNative = require('lodash.isnative');

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Native method references. */
var propertyIsEnumerable = objectProto.propertyIsEnumerable;

/* Native method references for those with the same name as other `lodash` methods. */
var nativeKeys = isNative(nativeKeys = Object.keys) && nativeKeys;

/**
 * Used as the maximum length of an array-like value.
 * See the [ES spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-number.max_safe_integer)
 * for more details.
 */
var MAX_SAFE_INTEGER = Math.pow(2, 53) - 1;

/**
 * An object environment feature flags.
 *
 * @static
 * @memberOf _
 * @type Object
 */
var support = {};

(function(x) {

  /**
   * Detect if `arguments` object indexes are non-enumerable.
   *
   * In Firefox < 4, IE < 9, PhantomJS, and Safari < 5.1 `arguments` object
   * indexes are non-enumerable. Chrome < 25 and Node.js < 0.11.0 treat
   * `arguments` object indexes as non-enumerable and fail `hasOwnProperty`
   * checks for indexes that exceed their function's formal parameters with
   * associated values of `0`.
   *
   * @memberOf _.support
   * @type boolean
   */
  try {
    support.nonEnumArgs = !propertyIsEnumerable.call(arguments, 1);
  } catch(e) {
    support.nonEnumArgs = true;
  }
}(0, 0));

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
  value = +value;
  length = length == null ? MAX_SAFE_INTEGER : length;
  return value > -1 && value % 1 == 0 && value < length;
}

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This function is based on ES `ToLength`. See the
 * [ES spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength)
 * for more details.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 */
function isLength(value) {
  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

/**
 * A fallback implementation of `Object.keys` which creates an array of the
 * own enumerable property names of `object`.
 *
 * @private
 * @param {Object} object The object to inspect.
 * @returns {Array} Returns the array of property names.
 */
function shimKeys(object) {
  var props = keysIn(object),
      propsLength = props.length,
      length = propsLength && object.length;

  var allowIndexes = length && isLength(length) &&
    (isArray(object) || (support.nonEnumArgs && isArguments(object)));

  var index = -1,
      result = [];

  while (++index < propsLength) {
    var key = props[index];
    if ((allowIndexes && isIndex(key, length)) || hasOwnProperty.call(object, key)) {
      result.push(key);
    }
  }
  return result;
}

/**
 * Checks if `value` is the language type of `Object`.
 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * **Note:** See the [ES5 spec](https://es5.github.io/#x8) for more details.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(1);
 * // => false
 */
function isObject(value) {
  // Avoid a V8 JIT bug in Chrome 19-20.
  // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
  var type = typeof value;
  return type == 'function' || (value && type == 'object') || false;
}

/**
 * Creates an array of the own enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects. See the
 * [ES spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.keys)
 * for more details.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The object to inspect.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keys(new Foo);
 * // => ['a', 'b'] (iteration order is not guaranteed)
 *
 * _.keys('hi');
 * // => ['0', '1']
 */
var keys = !nativeKeys ? shimKeys : function(object) {
  if (object) {
    var Ctor = object.constructor,
        length = object.length;
  }
  if ((typeof Ctor == 'function' && Ctor.prototype === object) ||
      (typeof object != 'function' && (length && isLength(length)))) {
    return shimKeys(object);
  }
  return isObject(object) ? nativeKeys(object) : [];
};

/**
 * Creates an array of the own and inherited enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The object to inspect.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keysIn(new Foo);
 * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
 */
function keysIn(object) {
  if (object == null) {
    return [];
  }
  if (!isObject(object)) {
    object = Object(object);
  }
  var length = object.length;
  length = (length && isLength(length) &&
    (isArray(object) || (support.nonEnumArgs && isArguments(object))) && length) || 0;

  var Ctor = object.constructor,
      index = -1,
      isProto = typeof Ctor == 'function' && Ctor.prototype === object,
      result = Array(length),
      skipIndexes = length > 0;

  while (++index < length) {
    result[index] = (index + '');
  }
  for (var key in object) {
    if (!(skipIndexes && isIndex(key, length)) &&
        !(key == 'constructor' && (isProto || !hasOwnProperty.call(object, key)))) {
      result.push(key);
    }
  }
  return result;
}

module.exports = keys;

},{"lodash.isarguments":17,"lodash.isarray":20,"lodash.isnative":18}],17:[function(require,module,exports){
/**
 * lodash 3.0.0 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.7.0 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */

/** `Object#toString` result references. */
var argsTag = '[object Arguments]';

/**
 * Checks if `value` is object-like.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 */
function isObjectLike(value) {
  return (value && typeof value == 'object') || false;
}

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the `toStringTag` of values.
 * See the [ES spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.prototype.tostring)
 * for more details.
 */
var objToString = objectProto.toString;

/**
 * Used as the maximum length of an array-like value.
 * See the [ES spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength)
 * for more details.
 */
var MAX_SAFE_INTEGER = Math.pow(2, 53) - 1;

/**
 * Checks if `value` is a valid array-like length.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 */
function isLength(value) {
  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

/**
 * Checks if `value` is classified as an `arguments` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * (function() { return _.isArguments(arguments); })();
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
function isArguments(value) {
  var length = isObjectLike(value) ? value.length : undefined;
  return (isLength(length) && objToString.call(value) == argsTag) || false;
}

module.exports = isArguments;

},{}],18:[function(require,module,exports){
/**
 * lodash 3.0.0 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.7.0 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */

/** `Object#toString` result references. */
var funcTag = '[object Function]';

/** Used to detect host constructors (Safari > 5). */
var reHostCtor = /^\[object .+?Constructor\]$/;

/**
 * Used to match `RegExp` special characters.
 * See this [article on `RegExp` characters](http://www.regular-expressions.info/characters.html#special)
 * for more details.
 */
var reRegExpChars = /[.*+?^${}()|[\]\/\\]/g,
    reHasRegExpChars = RegExp(reRegExpChars.source);

/**
 * Converts `value` to a string if it is not one. An empty string is returned
 * for `null` or `undefined` values.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 */
function baseToString(value) {
  if (typeof value == 'string') {
    return value;
  }
  return value == null ? '' : (value + '');
}

/**
 * Checks if `value` is object-like.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 */
function isObjectLike(value) {
  return (value && typeof value == 'object') || false;
}

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var fnToString = Function.prototype.toString;

/**
 * Used to resolve the `toStringTag` of values.
 * See the [ES spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.prototype.tostring)
 * for more details.
 */
var objToString = objectProto.toString;

/** Used to detect if a method is native. */
var reNative = RegExp('^' +
  escapeRegExp(objToString)
  .replace(/toString|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/**
 * Checks if `value` is a native function.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function, else `false`.
 * @example
 *
 * _.isNative(Array.prototype.push);
 * // => true
 *
 * _.isNative(_);
 * // => false
 */
function isNative(value) {
  if (value == null) {
    return false;
  }
  if (objToString.call(value) == funcTag) {
    return reNative.test(fnToString.call(value));
  }
  return (isObjectLike(value) && reHostCtor.test(value)) || false;
}

/**
 * Escapes the `RegExp` special characters "\", "^", "$", ".", "|", "?", "*",
 * "+", "(", ")", "[", "]", "{" and "}" in `string`.
 *
 * @static
 * @memberOf _
 * @category String
 * @param {string} [string=''] The string to escape.
 * @returns {string} Returns the escaped string.
 * @example
 *
 * _.escapeRegExp('[lodash](https://lodash.com/)');
 * // => '\[lodash\]\(https://lodash\.com/\)'
 */
function escapeRegExp(string) {
  string = baseToString(string);
  return (string && reHasRegExpChars.test(string))
    ? string.replace(reRegExpChars, '\\$&')
    : string;
}

module.exports = isNative;

},{}],19:[function(require,module,exports){
/**
 * lodash 3.0.0 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.7.0 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */

/**
 * A specialized version of `baseCallback` which only supports `this` binding
 * and specifying the number of arguments to provide to `func`.
 *
 * @private
 * @param {Function} func The function to bind.
 * @param {*} thisArg The `this` binding of `func`.
 * @param {number} [argCount] The number of arguments to provide to `func`.
 * @returns {Function} Returns the callback.
 */
function bindCallback(func, thisArg, argCount) {
  if (typeof func != 'function') {
    return identity;
  }
  if (typeof thisArg == 'undefined') {
    return func;
  }
  switch (argCount) {
    case 1: return function(value) {
      return func.call(thisArg, value);
    };
    case 3: return function(value, index, collection) {
      return func.call(thisArg, value, index, collection);
    };
    case 4: return function(accumulator, value, index, collection) {
      return func.call(thisArg, accumulator, value, index, collection);
    };
    case 5: return function(value, other, key, object, source) {
      return func.call(thisArg, value, other, key, object, source);
    };
  }
  return function() {
    return func.apply(thisArg, arguments);
  };
}

/**
 * This method returns the first argument provided to it.
 *
 * @static
 * @memberOf _
 * @category Utility
 * @param {*} value Any value.
 * @returns {*} Returns `value`.
 * @example
 *
 * var object = { 'user': 'fred' };
 * _.identity(object) === object;
 * // => true
 */
function identity(value) {
  return value;
}

module.exports = bindCallback;

},{}],20:[function(require,module,exports){
/**
 * lodash 3.0.0 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern modularize exports="npm" -o ./`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.7.0 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */

/** `Object#toString` result references. */
var arrayTag = '[object Array]',
    funcTag = '[object Function]';

/** Used to detect host constructors (Safari > 5). */
var reHostCtor = /^\[object .+?Constructor\]$/;

/**
 * Used to match `RegExp` special characters.
 * See this [article on `RegExp` characters](http://www.regular-expressions.info/characters.html#special)
 * for more details.
 */
var reRegExpChars = /[.*+?^${}()|[\]\/\\]/g,
    reHasRegExpChars = RegExp(reRegExpChars.source);

/**
 * Converts `value` to a string if it is not one. An empty string is returned
 * for `null` or `undefined` values.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 */
function baseToString(value) {
  if (typeof value == 'string') {
    return value;
  }
  return value == null ? '' : (value + '');
}

/**
 * Checks if `value` is object-like.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 */
function isObjectLike(value) {
  return (value && typeof value == 'object') || false;
}

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var fnToString = Function.prototype.toString;

/**
 * Used to resolve the `toStringTag` of values.
 * See the [ES spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.prototype.tostring)
 * for more details.
 */
var objToString = objectProto.toString;

/** Used to detect if a method is native. */
var reNative = RegExp('^' +
  escapeRegExp(objToString)
  .replace(/toString|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/* Native method references for those with the same name as other `lodash` methods. */
var nativeIsArray = isNative(nativeIsArray = Array.isArray) && nativeIsArray;

/**
 * Used as the maximum length of an array-like value.
 * See the [ES spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength)
 * for more details.
 */
var MAX_SAFE_INTEGER = Math.pow(2, 53) - 1;

/**
 * Checks if `value` is a valid array-like length.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 */
function isLength(value) {
  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * (function() { return _.isArray(arguments); })();
 * // => false
 */
var isArray = nativeIsArray || function(value) {
  return (isObjectLike(value) && isLength(value.length) && objToString.call(value) == arrayTag) || false;
};

/**
 * Checks if `value` is a native function.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function, else `false`.
 * @example
 *
 * _.isNative(Array.prototype.push);
 * // => true
 *
 * _.isNative(_);
 * // => false
 */
function isNative(value) {
  if (value == null) {
    return false;
  }
  if (objToString.call(value) == funcTag) {
    return reNative.test(fnToString.call(value));
  }
  return (isObjectLike(value) && reHostCtor.test(value)) || false;
}

/**
 * Escapes the `RegExp` special characters "\", "^", "$", ".", "|", "?", "*",
 * "+", "(", ")", "[", "]", "{" and "}" in `string`.
 *
 * @static
 * @memberOf _
 * @category String
 * @param {string} [string=''] The string to escape.
 * @returns {string} Returns the escaped string.
 * @example
 *
 * _.escapeRegExp('[lodash](https://lodash.com/)');
 * // => '\[lodash\]\(https://lodash\.com/\)'
 */
function escapeRegExp(string) {
  string = baseToString(string);
  return (string && reHasRegExpChars.test(string))
    ? string.replace(reRegExpChars, '\\$&')
    : string;
}

module.exports = isArray;

},{}]},{},[1]);
