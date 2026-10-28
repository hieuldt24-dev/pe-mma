export function userDto(user) {
  return { id: String(user._id), name: user.name, email: user.email };
}

export function transactionDto(item) {
  return {
    id: String(item._id),
    userId: String(item.userId),
    type: item.type,
    amount: item.amount,
    category: item.category,
    date: item.date,
    note: item.note,
  };
}
