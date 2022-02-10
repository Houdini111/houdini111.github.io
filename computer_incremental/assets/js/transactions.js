class Transaction {
    #resources;
    #costs;
    #effects;
    #costsIsArray;
    #resourcesIsArray;
    #valid;

	constructor(resources, costs, effects) {
        this.resources = resources;
        this.costs = costs;
        this.effects = effects;
        this.costsIsArray = !!costs && Array.isArray(costs);
        this.resourcesIsArray = !!resources && Array.isArray(resources);
        if (this.resourcesIsArray) {
            let propertyList = [];
            for (let resource of resources) {
                let splitResource = resource.split('.');
                propertyList.push(splitResource);
            }
            this.resources = propertyList;
        }
        this.valid = this.costsIsArray == this.resourcesIsArray;
	}

    attempt(save_data) {
        if (!this.canComplete(save_data)) {
            return false;
        } else {
            this.takeCost(save_data);
            this.doEffects(save_data);
        }
    }

    takeCost(save_data) {
        if (!this.resources && !this.costs) {
            return;
        } else if (this.resourcesIsArray) {
            //Multiple costs
            for (let i = 0; i < this.resources.length; i++) {
                let resourcePath = this.resources[i];
                let resourceCost = this.costs[i];
                this.subtractNestedResource(save_data, resourcePath, resourceCost);
            }
            return false;
        } else {
            //Single item cost
            this.subtractNestedResource(save_data, this.resources, this.costs);
        }
    }

    canComplete(save_data) {
        if (!this.valid) {
            return false;
        }
        else if (this.resources == null && this.costs == null) {
            //No cost
            return true;
        }
        else if (this.resourcesIsArray) {
            //Multiple costs
            for (let i = 0; i < this.resources.length; i++) {
                let resourcePath = this.resources[i];
                let resourceCost = this.costs[i];
                let availableResource = htis.getNestedPropertyValue(save_data, resourcePath);
                if (availableResource < resourceCost) {
                    return false;
                }
            }
            return false;
        } else {
            //Single item cost
            let availableResource = this.getNestedPropertyValue(save_data, this.resources);
            if (availableResource < this.costs) {
                return false;
            }
        }
        return true;
    }

    doEffects(save_data) {
        if (!this.effects) {
            return;
        } else if (Array.isArray(this.effects)) {
            for (let effect of this.effects) {
                effect();
            }
        } else {
            this.effects();
        }
    }

    getNestedPropertyValue(obj, propertyList) {
        if (propertyList == null) {
            return null;
        } else if (!Array.isArray(propertyList)) {
            return obj[propertyList];
        } else {
            let nextProperty = propertyList.shift();
            if (propertyList.length == 0) {
                return obj[nextProperty];
            } else {
                return this.getNestedPropertyValue(obj[nextProperty], propertyList);
            }
        }
    }

    subtractNestedResource(obj, propertyList, cost) {
        if (propertyList == null) {
            return;
        } else if (!Array.isArray(propertyList)) {
            obj[propertyList] -= cost;
        } else {
            let nextProperty = propertyList.shift();
            if (propertyList.length == 0) {
                obj[nextProperty] -= cost;
            } else {
                this.subtractNestedResource(obj[nextProperty], propertyList, cost);
            }
        }
    }
}