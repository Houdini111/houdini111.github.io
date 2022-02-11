class TransactionMaster {
    transactions;
    transaction_resource_to_button_map;
    transaction_button_to_resource_map;

    constructor() {
        this.transactions = [];
        this.transaction_resource_to_button_map = new Map();
        this.transaction_button_to_resource_map = new Map();
    }

    create_transaction(buttonId, requiredResources, resourceCosts, resultEffects) {
        let transaction = new Transaction(requiredResources, resourceCosts, resultEffects);
        if (transaction.valid !== true) {
            return;
        }
        let button = document.getElementById(buttonId);
        this.transactions.push(transaction);
        this.add_to_cost_map(transaction.resources, resourceCosts, button);
        this.add_button_hold_transaction(button, transaction);
    }

    add_to_cost_map(requiredResources, resourceCosts, button) {
        if (requiredResources != null) {
            //Don't rely on trasnaction.resouces for the array check since it's always going to be a path array
            if (Array.isArray(resourceCosts)) {
                for (let i = 0; i < requiredResources.length; i++) {
                    let resource = requiredResources[i];
                    let transactionCost = new TransactionCost(resource, resourceCosts[i], button);
                    this.push_on_cost_map(resource, transactionCost);
                }
            } else {
                let transactionCost = new TransactionCost(requiredResources, resourceCosts, button);
                this.push_on_cost_map(requiredResources, transactionCost);
            }
        }
    }

    add_button_hold_transaction(button, transaction) {
        if (button) {
            const transactionMaster = this;
            button.addEventListener('mousedown', function (event) {
                button_hold_click(event, function () {
                    let success = transaction.attempt(save_data);
                    if (success) {
                        transactionMaster.do_all_cost_checks(save_data, transaction);
                    }
                })
            });
        }
    }

    do_all_cost_checks(save_data, transaction) {
        if (transaction.resources != null) {
            //Don't rely on trasnaction.resouces for the array check since it's always going to be a path array
            if (Array.isArray(transaction.costs)) {
                for (let i = 0; i < transaction.costs.length; i++) {
                    let resource = transaction.resources[i];
                    this.do_cost_check(save_data, resource);
                }
            } else {
                this.do_cost_check(save_data, transaction.resources);
            }
        }
    }

    do_cost_check(save_data, resourceArray) {
        let resourcePath = resourceArray.join('.');
        if (this.transaction_resource_to_button_map.has(resourcePath)) {
            const resourceAmount = save_data[resourceArray];
            const transactionCostArray = this.transaction_resource_to_button_map.get(resourcePath);
            for (let transactionCost of transactionCostArray) {
                let canAffordThisResource = transactionCost.requiredAmount <= resourceAmount;
                if (canAffordThisResource == isDisabled(transactionCost.associatedButton)) {
                    //State mismatch for this resource. 
                    if (canAffordThisResource) {
                        //Can afford this one but can the others be afforded?
                        let resourceCostsForThisButton = this.transaction_button_to_resource_map.get(transactionCost.associatedButton);
                        let canAfford = true;
                        for (let resourceCostForThisButton of resourceCostsForThisButton) {
                            let resourceAmountForCost = getNestedPropertyValue(save_data, resourceCostForThisButton.resource);
                            if (resourceAmountForCost < resourceCostForThisButton.requiredAmount) {
                                canAfford = false;
                                break;
                            }
                        }
                        setDisabled(transactionCost.associatedButton, !canAfford);
                    } else {
                        //Cannot afford it because of this resource but butten enabled, disable it
                        setDisabled(transactionCost.associatedButton, true);
                    }
                }
            }
        }
    }

    push_on_cost_map(resourceArray, button) {
        let resourcePath = resourceArray.join('.');
        let button_array = this.transaction_resource_to_button_map.get(resourcePath);
        if (button_array == null) {
            button_array = [];
            this.transaction_resource_to_button_map.set(resourcePath, button_array);
        }
        button_array.push(button);
        let cost_array = this.transaction_button_to_resource_map.get(button);
        if (cost_array == null) {
            cost_array = [];
            this.transaction_button_to_resource_map.set(button, cost_array);
        }
        cost_array.push(resourceArray);
    }
}

//TODO: Maybe make this hold all costs for a resource?
class TransactionCost {
    resource;
    requiredAmount;
    associatedButton;

    constructor(resource, requiredAmount, associatedButton) {
        this.resource = resource;
        this.requiredAmount = requiredAmount;
        this.associatedButton = associatedButton;
    }
}

class Transaction {
    resources;
    costs;
    effects;
    costsIsArray;
    resourcesIsArray;
    valid;

	constructor(resources, costs, effects) {
        this.resources = resources;
        this.costs = costs;
        this.effects = effects;
        this.costsIsArray = !!costs && Array.isArray(costs);
        this.resourcesIsArray = !!resources && Array.isArray(resources);
        let lengthEqual = true;
        if (this.resourcesIsArray) {
            let propertyList = [];
            for (let resource of resources) {
                let splitResource = resource.split('.');
                propertyList.push(splitResource);
            }
            this.resources = propertyList;
            lengthEqual = this.resources.length == this.costs;
        } else if (resources != null) {
            this.resources = resources.split('.');
        }
        this.valid = this.costsIsArray == this.resourcesIsArray && lengthEqual;
	}

    attempt(save_data) {
        if (!this.canComplete(save_data)) {
            return false;
        } else {
            this.takeCost(save_data);
            this.doEffects(save_data);
            return true;
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
                let availableResource = getNestedPropertyValue(save_data, resourcePath);
                if (availableResource < resourceCost) {
                    return false;
                }
            }
            return false;
        } else {
            //Single item cost
            let availableResource = getNestedPropertyValue(save_data, this.resources);
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

    subtractNestedResource(obj, propertyList, cost) {
        let propertyListCopy = [...propertyList];
        if (propertyListCopy == null) {
            return;
        } else if (!Array.isArray(propertyListCopy)) {
            obj[propertyListCopy] -= cost;
        } else {
            let nextProperty = propertyListCopy.shift();
            if (propertyListCopy.length == 0) {
                obj[nextProperty] -= cost;
            } else {
                this.subtractNestedResource(obj[nextProperty], propertyListCopy, cost);
            }
        }
    }
}