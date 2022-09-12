const express = require('express');
const { v4: uuidV4 } = require('uuid');

const app = express();
app.use(express.json());

const customers = [];

//Middleware
function verifyIfExistsAccountCPF(request, response, next) {
  const { cpf } = request.headers;

  const customer = customers.find((customer) => customer.cpf === cpf);

  if (!customer) {
    return response.status(400).json({ error: 'Customer not found' });
  }

  request.customer = customer;

  return next();
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === 'credit') {
      return acc + operation.amount;
    } else {
      return acc - operation.amount;
    }
  }, 0);

  return balance;
}

app.post('/account', (request, response) => {
  const { cpf, name } = request.body;

  const customerAlreadyExists = customers.some(
    (customer) => customer.cpf === cpf
  );

  if (customerAlreadyExists) {
    return response.status(400).json({
      error: 'Customer already exists!',
    });
  }

  customers.push({
    cpf,
    name,
    id: uuidV4(),
    statement: [],
  });

  registeredCustomer = customers.find((customer) => customer.cpf === cpf);

  return response.status(201).send({
    result: 'success',
    message: 'Account created successfully',
    customer: registeredCustomer,
  });
});

app.put('/account', verifyIfExistsAccountCPF, (request, response) => {
  const { name } = request.body;
  const { customer } = request;

  console.log(customer, name);

  customer.name = name;

  return response.status(201).send({
    result: 'success',
    message: 'Successful updating account',
    customer,
  });
});

app.get('/account', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;

  return response.json({
    result: 'success',
    message: 'Success finding the account',
    customer
  });
})

app.get('/statement', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;

  const balance = getBalance(customer.statement);

  return response.json({
    result: 'success',
    message: 'Statement successfully obtained',
    statement: customer.statement,
    balance,
  });
});

app.get('/statement/date', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;
  const { date } = request.query;

  const dateFormat = new Date(date + ' 00:00');

  const statement = customer.statement.filter(
    (statement) =>
      statement.created_at.toDateString() ===
      new Date(dateFormat).toDateString()
  );

  const balance = getBalance(customer.statement);

  return response.json({
    result: 'success',
    message: 'Statement by Date successfully obtained',
    statement: statement,
    balance,
  });
});

app.post('/deposit', verifyIfExistsAccountCPF, (request, response) => {
  const { description, amount } = request.body;

  const { customer } = request;

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: 'credit',
  };

  customer.statement.push(statementOperation);

  return response
    .status(201)
    .send({ result: 'success', message: 'Deposit made successfully' });
});

app.post('/withdraw', verifyIfExistsAccountCPF, (request, response) => {
  const { amount } = request.body;
  const { customer } = request;

  const balance = getBalance(customer.statement);

  if (balance < amount) {
    return response.status(400).json({
      result: 'error',
      message: 'Insufficient funds',
      balance: balance,
    });
  }

  const statementOperation = {
    amount,
    created_at: new Date(),
    type: 'debit',
  };

  customer.statement.push(statementOperation);

  const updateBalance = getBalance(customer.statement);

  return response.status(201).send({
    result: 'success',
    message: 'Successful withdrawal',
    balance: updateBalance,
  });
});



app.listen(3333);
