const db = require('../config/db');

// Get all pending orders
exports.getPendingOrders = (req, res) => {
    db.query('SELECT * FROM pending_orders', (err, results) => {
        if (err) throw err;
        res.json(results);
    });
};

// Get all completed orders
exports.getCompletedOrders = (req, res) => {
    db.query('SELECT * FROM completed_orders', (err, results) => {
        if (err) throw err;
        res.json(results);
    });
};

// Add new order and match orders
exports.addOrder = (req, res) => {
    const { buyerQty, buyerPrice, sellerPrice, sellerQty, isBuyer } = req.body;

    if (isBuyer) {
        db.beginTransaction(err => {
            if (err) throw err;

            // Find all seller orders where the seller's price is less than or equal to the buyer's price
            db.query('SELECT * FROM pending_orders WHERE seller_price <= ?', [buyerPrice], (err, results) => {
                if (err) {
                    return db.rollback(() => {
                        throw err;
                    });
                }

                let qty = buyerQty;

                results.forEach(order => {
                    if (qty === 0) return;

                    const matchedQty = Math.min(qty, order.seller_qty);

                    // Insert into completed_orders
                    db.query('INSERT INTO completed_orders (price, qty) VALUES (?, ?)', [order.seller_price, matchedQty], (err) => {
                        if (err) {
                            return db.rollback(() => {
                                throw err;
                            });
                        }
                    });

                    // Update or delete pending_orders based on matched quantity
                    if (matchedQty < order.seller_qty) {
                        db.query('UPDATE pending_orders SET seller_qty = seller_qty - ? WHERE id = ?', [matchedQty, order.id], (err) => {
                            if (err) {
                                return db.rollback(() => {
                                    throw err;
                                });
                            }
                        });
                    } else {
                        db.query('DELETE FROM pending_orders WHERE id = ?', [order.id], (err) => {
                            if (err) {
                                return db.rollback(() => {
                                    throw err;
                                });
                            }
                        });
                    }

                    qty -= matchedQty;
                });

                // Insert remaining buyer order into pending_orders if not fully matched
                if (qty > 0) {
                    db.query('INSERT INTO pending_orders (buyer_qty, buyer_price) VALUES (?, ?)', [qty, buyerPrice], (err) => {
                        if (err) {
                            return db.rollback(() => {
                                throw err;
                            });
                        }

                        db.commit(err => {
                            if (err) {
                                return db.rollback(() => {
                                    throw err;
                                });
                            }

                            res.send('Order matched and pending order updated');
                        });
                    });
                } else {
                    db.commit(err => {
                        if (err) {
                            return db.rollback(() => {
                                throw err;
                            });
                        }

                        res.send('Order fully matched');
                    });
                }
            });
        });
    } else {
        db.beginTransaction(err => {
            if (err) throw err;

            // Find all buyer orders where the buyer's price is greater than or equal to the seller's price
            db.query('SELECT * FROM pending_orders WHERE buyer_price >= ?', [sellerPrice], (err, results) => {
                if (err) {
                    return db.rollback(() => {
                        throw err;
                    });
                }

                let qty = sellerQty;

                results.forEach(order => {
                    if (qty === 0) return;

                    const matchedQty = Math.min(qty, order.buyer_qty);

                    // Insert into completed_orders
                    db.query('INSERT INTO completed_orders (price, qty) VALUES (?, ?)', [order.buyer_price, matchedQty], (err) => {
                        if (err) {
                            return db.rollback(() => {
                                throw err;
                            });
                        }
                    });

                    // Update or delete pending_orders based on matched quantity
                    if (matchedQty < order.buyer_qty) {
                        db.query('UPDATE pending_orders SET buyer_qty = buyer_qty - ? WHERE id = ?', [matchedQty, order.id], (err) => {
                            if (err) {
                                return db.rollback(() => {
                                    throw err;
                                });
                            }
                        });
                    } else {
                        db.query('DELETE FROM pending_orders WHERE id = ?', [order.id], (err) => {
                            if (err) {
                                return db.rollback(() => {
                                    throw err;
                                });
                            }
                        });
                    }

                    qty -= matchedQty;
                });

                // Insert remaining seller order into pending_orders if not fully matched
                if (qty > 0) {
                    db.query('INSERT INTO pending_orders (seller_qty, seller_price) VALUES (?, ?)', [qty, sellerPrice], (err) => {
                        if (err) {
                            return db.rollback(() => {
                                throw err;
                            });
                        }

                        db.commit(err => {
                            if (err) {
                                return db.rollback(() => {
                                    throw err;
                                });
                            }

                            res.send('Order matched and pending order updated');
                        });
                    });
                } else {
                    db.commit(err => {
                        if (err) {
                            return db.rollback(() => {
                                throw err;
                            });
                        }

                        res.send('Order fully matched');
                    });
                }
            });
        });
    }
};
