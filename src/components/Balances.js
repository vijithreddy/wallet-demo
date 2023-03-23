
import "../App.css";
import "bulma/css/bulma.css";




function Balances({table_data, cb_cloud_obj, wallet_address, count}){
    console.log("Count from Balances: ",count)
    
    return(
        <div>
        <h3> Balances: </h3>
        <table className="styled-table">
          <thead>
            <tr>
              <th>Token Name</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {table_data.map((value, key) => {
              return (
                <tr key={key}>
                  <td>{value.token_name}</td>
                  <td>{value.balance}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
    );

}

export default Balances;