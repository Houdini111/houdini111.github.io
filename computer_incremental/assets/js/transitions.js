class Transition {
	constructor(target, property, duration, minValue, maxValue, onCompletion, earlyEnd) {
		this.target = target;
		this.property = property;
		this.duration = duration;
		this.progress = 0;
		this.minValue = minValue;
		this.maxValue = maxValue;
		this.onCompletion = onCompletion;
		this.earlyEnd = earlyEnd;
	}
}


function update_transitions(dt) {
	if (transitionings && transitionings.length > 0) {
		for (let i = transitionings.length - 1; i >= 0; i--) {
			const transition = transitionings[i];
			transition.progress += dt;
			if (transition.progress >= transition.duration) {
				transition.progress = transition.duration;
				if (transition.onCompletion) {
					transition.onCompletion();
				}
				transitionings.splice(i, 1);
			}
			const lerped = lerp(transition.minValue, transition.maxValue, transition.progress / transition.duration);
			setTransitionValue(transition.target, transition.property, lerped);
		}
	}
}

function setTransitionValue(target, property, value) {
	if (property === 'background-position' || property === 'background-position-x' || property === 'background-position-y') {
		target.style[property] = value + '%';
	} else {
		target.style[property] = value;
	}
}


function earlyEndTransitions(earlyEndType) {
	if (transitionings && transitionings.length > 0) {
		for (let i = transitionings.length - 1; i >= 0; i--) {
			const transition = transitionings[i];
			if (transition.earlyEnd == earlyEndType) {
				transitionings.splice(i, 1);
				setTransitionValue(transition.target, transition.property, transition.maxValue);
			}
		}
	}
}