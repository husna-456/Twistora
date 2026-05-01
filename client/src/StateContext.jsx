import { createContext, useContext, useReducer } from 'react';

export const StateContext = createContext();

const initialState = {
  basket: JSON.parse(localStorage.getItem('basket')) || [],
  user: null,
};

function reducer(state, action) {
  switch (action.type) {

    case 'ADD_TO_BASKET': {
      const newBasket = [...state.basket, action.item];
      localStorage.setItem('basket', JSON.stringify(newBasket));
      return {
        ...state,
        basket: newBasket,
      };
    }

    case 'REMOVE_FROM_BASKET': {
      const index = state.basket.findIndex((item) => item.id === action.id);
      let newBasket = [...state.basket];
      if (index >= 0) newBasket.splice(index, 1);
      localStorage.setItem('basket', JSON.stringify(newBasket));
      return {
        ...state,
        basket: newBasket,
      };
    }

    case 'EMPTY_BASKET': {
      localStorage.removeItem('basket');
      return {
        ...state,
        basket: [],
      };
    }

    case 'SET_USER':
      return {
        ...state,
        user: action.user,
      };

    default:
      return state;
  }
}

export function StateProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <StateContext.Provider value={{ state, dispatch }}>
      {children}
    </StateContext.Provider>
  );
}

export function useStateValue() {
  return useContext(StateContext);
}