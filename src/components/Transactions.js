import "bulma/css/bulma.css";
import "../App.css";

function Transactions({ transaction_data }) {
    console.log("How many times is this called? ")
  return (
    <div className="table-container">
      <h3> Transactions: </h3>
        <table className="styled-table">
          <thead>
            <tr>
              <th>Age</th>
              <th>Block Number</th>
              <th>From</th>
              <th>To</th>
              <th>Transaction Hash</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {transaction_data.map((value, index) => {
              return (
                <tr key={index}>
                  <td>{value.age}</td>
                  <td>{value.block_number}</td>
                  <td>{value.from}</td>
                  <td>{value.to}</td>
                  <td>{value.hash}</td>
                  <td>{value.value}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
    </div>
  );
}

export default Transactions;
