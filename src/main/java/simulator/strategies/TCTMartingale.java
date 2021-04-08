package simulator.strategies;

import simulator.ROLL;
import simulator.Simulator;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

// Note, careful with dices
/*
 * Bet CT after two Ts
 * Bet T after two CTs
 * But only if in the last 100 plays CT or T are below LIMIT
* */
public class TCTMartingale extends Strategy {
    private static final BigDecimal BET_AMOUNT = BigDecimal.valueOf(1).setScale(2, RoundingMode.HALF_UP);
    private static final int LIMIT = 40;
    private final Simulator simulator;


    public TCTMartingale(Simulator simulator) {
        super("TCTMartingale");
        this.simulator = simulator;
    }

    @Override
    public void processResult(ROLL roll) {
        if (didIBet) {
            if (roll.equals(betCoin)) {
                balance = balance.add(betPotentialReturn).setScale(2, RoundingMode.HALF_UP);
                resetBetInfo();
            }
        }
    }

    @Override
    public void handleNextDecision(ROLL roll) throws Exception {
        List<ROLL> previous2Rolls = simulator.getPreviousXRolls(5);
        if (previous2Rolls.size() == 5) {
            List<ROLL> ctFilter = previous2Rolls.stream().filter(r -> r.equals(ROLL.CT)).collect(Collectors.toList());
            List<ROLL> tFilter = previous2Rolls.stream().filter(r -> r.equals(ROLL.T)).collect(Collectors.toList());
            if ((ctFilter.size() == 5) || (tFilter.size() == 5)) {
                betCoin = ctFilter.size() == 5 ? ROLL.T : ROLL.CT;
                BigDecimal toBetAmount = BET_AMOUNT.setScale(2, RoundingMode.HALF_UP);;

                if (didIBet)
                    toBetAmount = betAmount.multiply(BigDecimal.valueOf(2)).setScale(2, RoundingMode.HALF_UP);

                super.performBet(toBetAmount.setScale(2, RoundingMode.HALF_UP), betCoin);
            }
        }
    }

    @Override
    public String print() {
        return "Strategy: " + this.getClass().getSimpleName() + "\nBalance = " + balance + "\n";
    }
}
