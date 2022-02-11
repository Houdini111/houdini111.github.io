class TransactionMaster {
    save_data;
    transactions;
    cost_to_transaction_map;

    constructor(save_data) {
        this.save_data = save_data;
        this.transactions = [];
        this.cost_to_transaction_map = new Map();
    }

    add_transaction(buttonId, costs, results, sideEffect) {
        let transaction = new Transaction(buttonId, costs, results, sideEffect);
        this.transactions.push(transaction);
        if (transaction.costs != null) {
            for (let cost of transaction.costs) {
                this.add_to_cost_map(cost, transaction);
            }
        }
        this.add_button_hold_transaction(transaction);
    }

    add_to_cost_map(cost, transaction) {
        let transactions_for_resource_cost = this.cost_to_transaction_map.get(cost.path);
        if (transactions_for_resource_cost == null) {
            transactions_for_resource_cost = [];
            this.cost_to_transaction_map.set(cost.path, transactions_for_resource_cost);
        }
        transactions_for_resource_cost.push(transaction);
    }

    add_button_hold_transaction(transaction) {
        if (transaction.button) {
            const transactionMaster = this;
            transaction.button.addEventListener('mousedown', function (event) {
                button_hold_click(event, function () {
                    let success = transaction.attemptComplete(transactionMaster.save_data);
                    if (success) {
                        transactionMaster.do_resource_checks(transaction);
                    }
                })
            });
        }
    }

    do_resource_checks(transaction) {
        this.do_resource_check(this.save_data, transaction.costs);
        this.do_resource_check(this.save_data, transaction.results);
    }

    do_resource_check(save_data, resourceAmountsChanged) {
        if (resourceAmountsChanged == null) {
            return null;
        }
        for (let resourceAmountChanged of resourceAmountsChanged) {
            const transactionsAffectedByChange = this.cost_to_transaction_map.get(resourceAmountChanged.path);
            if (transactionsAffectedByChange == null) {
                continue;
            }
            for (let transactionAffectedByChange of transactionsAffectedByChange) {
                let buttonCurrentlyDisabled = isDisabled(transactionAffectedByChange.button);
                let affectedTransactionAffordable = transactionAffectedByChange.canComplete(save_data);
                if (affectedTransactionAffordable && buttonCurrentlyDisabled) {
                    setEnabled(transactionAffectedByChange.button);
                } else if (!affectedTransactionAffordable && !buttonCurrentlyDisabled) {
                    setDisabled(transactionAffectedByChange.button);
                }
            }
        }
    }
}

class Transaction {
    costs;
    results;
    sideEffect;
    button;

    constructor(buttonId, costs, results, sideEffect) {
        this.button = document.getElementById(buttonId);
        if (costs != null) {
            if (!Array.isArray(costs)) {
                costs = [costs];
            }
            this.costs = [];
            for (let cost of costs) {
                this.costs.push(new TransactionResourceAmount(cost[0], cost[1]));
            }
        }
        if (results != null) {
            if (!Array.isArray(results)) {
                results = [results];
            }
            this.results = [];
            for (let result of results) {
                this.results.push(new TransactionResourceAmount(result[0], result[1]));
            }
        }
        this.sideEffect = sideEffect;
    }

    attemptComplete(save_data) {
        if (this.canComplete(save_data)) {
            this.doComplete(save_data);
            return true;
        }
        return false;
    }

    canComplete(save_data) {
        if (this.costs == null) {
            return true;
        }
        for (let cost of this.costs) {
            let currentAmount = save_data.getResourceFromPath(cost.path);
            let requiredAmount = cost.amount;
            if (currentAmount < requiredAmount) {
                return false;
            }
        }
        return true;
    }

    doComplete(save_data) {
        if (this.costs != null) {
            for (let cost of this.costs) {
                save_data.changeResourceAtPath(cost.path, -1 * cost.amount);
            }
        }
        if (this.results != null) {
            for (let result of this.results) {
                save_data.changeResourceAtPath(result.path, result.amount);
            }
        }
        if (this.sideEffect != null) {
            this.sideEffect();
        }
    }

    getResourceCostForResourcePath(path) {
        if (this.costs == null) {
            return null;
        }
        for (let cost of this.costs) {
            if (cost.path === path) {
                return cost.amount;
            }
        }
    }
}

class TransactionResourceAmount {
    path;
    amount;

    constructor(pathString, amount) {
        this.path = pathString;
        this.amount = amount;
    }
}