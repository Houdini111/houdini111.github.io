class UnlockMaster {
    unlocks;

    constructor() {
        this.unlocks = [];
    }

    addUnlock(requirements, effect) {
        if (requirements == null || effect == null) {
            return;
        }
        if (!Array.isArray(requirements)) {
            requirements = [requirements];
        }
        let unlock = new Unlock(requirements, effect);
        this.unlocks.push(unlock);
    }

    load(save_data) {

    }

    attemptUnlocksForResources(resourcePaths, save_data) {
        if (resourcePaths == null) {
            return;
        }
        if (!Array.isArray(resourcePaths)) {
            this.attemptUnlocksForResource(resourcePaths, save_data);
        } else {
            for (let resourcePath of resourcePaths) {
                this.attemptUnlocksForResource(resourcePath, save_data);
            }
        }
    }

    attemptUnlocksForResource(resourcePath, save_data) {
        for (let i = 0; i < this.unlocks.length; i++) {
            let unlock = this.unlocks[i];
            if (!unlock.containsRequirementForResoruce(resourcePath)) {
                continue;
            }
            let successfulUnlock = unlock.attemptUnlock(save_data);
            if (successfulUnlock) {
                this.unlocks.splice(i, 1);
                i--;
            }
        }
    }

    attemptAllUnlocks(save_data) {
        for (let i = 0; i < this.unlocks.length; i++) {
            let unlock = this.unlocks[i];
            let successfulUnlock = unlock.attemptUnlock(save_data);
            if (successfulUnlock) {
                this.unlocks.splice(i, 1);
                i--;
            }
        }
    }
}

class Unlock {
    requirements;
    result;

    constructor(requirements, result) {
        let requirementArr = [];
        for (let requirement of requirements) {
            let unlockRequirement = new UnlockRequirement(requirement[0], requirement[1]);
            requirementArr.push(unlockRequirement);
        }
        this.requirements = requirementArr;
        this.result = result;
    }

    attemptUnlock(save_data) {
        if (this.satisfied(save_data)) {
            this.result();
            return true;
        }
        return false;
    }

    satisfied(save_data) {
        for (let requirement of this.requirements) {
            if (!requirement.satisfied(save_data)) {
                return false;
            }
        }
        return true;
    }

    containsRequirementForResoruce(resourcePath) {
        for (let requirement of this.requirements) {
            if (requirement.resourcePath === resourcePath) {
                return true;
            }
        }
        return false;
    }
}

class UnlockRequirement {
    resourcePath;
    amount;

    constructor(resourcePath, amount) {
        this.resourcePath = resourcePath;
        this.amount = amount;
    }

    satisfied(save_data) {
        let currentAmount = save_data.getResourceFromPath(this.resourcePath);
        return currentAmount >= this.amount;
    }
}