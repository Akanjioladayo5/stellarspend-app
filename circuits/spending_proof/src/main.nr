fn main(payment_amount: Field, spending_limit: Field) {
    let amount = payment_amount as u64;
    let limit = spending_limit as u64;
    assert(amount <= limit);
}
