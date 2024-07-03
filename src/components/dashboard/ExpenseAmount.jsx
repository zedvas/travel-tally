import { addDecimals } from "../../utils/utils";
import { getCurrencySymbol } from "../../utils/utils";

const ExpenseAmount = ({ homeCurrencySymbol, amount, currencyCodes }) => {
  const { fromCurrency, toValue, fromValue } = amount;
  return (
    <div>
      <p>
        {homeCurrencySymbol}
        {addDecimals(toValue)}
      </p>
      <p className="foreignAmount">
        {getCurrencySymbol(currencyCodes, fromCurrency)}
        {addDecimals(fromValue)}
      </p>
    </div>
  );
};

export default ExpenseAmount;
