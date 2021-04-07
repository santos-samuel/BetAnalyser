package simulator;

import com.fasterxml.jackson.databind.ObjectMapper;
import simulator.strategies.Strategy;
import simulator.strategies.TCTMartingale;
import simulator.strategies.WaitTwoStrategy;
import simulator.strategies.WaitTwoStrategyButWatchPast100;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Simulator {

    public final static String PROJECT_DIR_PATH = System.getProperty("user.dir");
    public final static File PROJECT_DIR = new File(PROJECT_DIR_PATH);
    public final static String RESOURCES_PATH = PROJECT_DIR_PATH + File.separator + "src" + File.separator + "main" + File.separator + "resources" + File.separator;
    private final static String SEEDS_DIR_PATH = RESOURCES_PATH + "seeds";
    private final static File SEEDS_DIR = new File(SEEDS_DIR_PATH);
    public final static File LOG_FILE = new File(new File(RESOURCES_PATH), "log.csv");
    private final String[] sortedSeedFiles;

    private static final int ROLL_COUNT = 100;
    private final ObjectMapper mapper;

    private int fileIndex = 0;
    private int currentRollIndex = -1;
    private List<String> currentRolls;
    private final List<ROLL> pastRolls;
    private final LastPlays lastPlays;

    private List<Strategy> strategies;

    public Simulator() throws IOException {
        sortedSeedFiles = SEEDS_DIR.list();
        assert sortedSeedFiles != null;
        Arrays.sort(sortedSeedFiles);

        mapper = new ObjectMapper();
        currentRolls = (ArrayList<String>) mapper.readValue(new File(SEEDS_DIR, sortedSeedFiles[fileIndex]), List.class);
        pastRolls = new ArrayList<>();
        lastPlays = new LastPlays();
        strategies = new ArrayList<>();

        if (!LOG_FILE.exists())
            LOG_FILE.delete();

        LOG_FILE.createNewFile();

        FileWriter fw = new FileWriter(LOG_FILE, true);
        BufferedWriter bw = new BufferedWriter(fw);
        bw.write("n,b,s");
        bw.newLine();
        bw.close();
    }

    /*
    * Return last 2 rolls. This includes the currentRoll.
    * */
    public List<ROLL> getPreviousXRolls(int x) throws IOException {
        if (x <= 0)
            return null;

        int less1 = x - 1;

        if (currentRollIndex - less1 < 0) {
            if (fileIndex == 0) {
                List<ROLL> toReturn = new ArrayList<>();
                for (int i = 0; i < currentRollIndex + 1; i++)
                    toReturn.add(parseStringRoll(currentRolls.get(i)));
                return toReturn;
            } else {
                int rollsToGetFromPreviousFile = less1 - currentRollIndex;
                List<String> previousRolls = (ArrayList<String>) mapper.readValue(new File(SEEDS_DIR, sortedSeedFiles[fileIndex - 1]), List.class);

                List<ROLL> toReturn = new ArrayList<>();

                for (int i = previousRolls.size() - rollsToGetFromPreviousFile; i < previousRolls.size(); i++)
                    toReturn.add(parseStringRoll(previousRolls.get(i)));

                for (int i = 0; i < currentRollIndex + 1; i++)
                    toReturn.add(parseStringRoll(currentRolls.get(i)));

                return toReturn;
            }
        } else {
            List<ROLL> toReturn = new ArrayList<>();
            for (int i = currentRollIndex - less1; i < currentRollIndex + 1; i++)
                toReturn.add(parseStringRoll(currentRolls.get(i)));

            return toReturn;
        }
    }

    public ROLL getNextRoll() throws Exception {
        currentRollIndex++;

        String roll = null;

        if (currentRollIndex != currentRolls.size())
            roll = currentRolls.get(currentRollIndex);

        if (roll == null) {
            fileIndex++;

            if (sortedSeedFiles.length == fileIndex + 1) {
                System.out.println("NO MORE ROLLS");
                return null;
            }

            currentRollIndex = 0;
            currentRolls = (ArrayList<String>) mapper.readValue(new File(SEEDS_DIR, sortedSeedFiles[fileIndex]), List.class);
            roll = currentRolls.get(currentRollIndex);
        }

        ROLL returnRoll = parseStringRoll(roll);

        pastRolls.add(returnRoll);
        if (pastRolls.size() < ROLL_COUNT) {
//            lastPlays.add(returnRoll);
        }
        else {
            ROLL remove = pastRolls.remove(0);
            lastPlays.update(remove, returnRoll);
        }

        return returnRoll;
    }

    private void run() throws Exception {
        long i = 0;
        while (true) {
            ROLL roll = getNextRoll();
            if (roll == null)
                break;

            for (Strategy strategy : strategies) {
                strategy.processResult(roll);
                strategy.log(i);
                strategy.handleNextDecision(roll);
            }
            i++;
        }
    }

    private void addStrategies(List<Strategy> str) {
        this.strategies.addAll(str);
    }

    public ROLL parseStringRoll(String roll) {
        ROLL returnRole;
        if (roll.equals("t"))
            returnRole = ROLL.T;
        else if (roll.equals("ct"))
            returnRole = ROLL.CT;
        else
            returnRole = ROLL.DICE;
        return returnRole;
    }

    public LastPlays getLastPlays() {
        return lastPlays;
    }

    public static void main(String[] args) throws Exception {
        Simulator simulator = new Simulator();
        List<Strategy> strategies = new ArrayList<>();
        strategies.add(new WaitTwoStrategy(simulator));
        strategies.add(new WaitTwoStrategyButWatchPast100(simulator));
        strategies.add(new TCTMartingale(simulator));
        simulator.addStrategies(strategies);
        simulator.run();

        for (Strategy strategy : strategies) {
            System.out.println(strategy.print());
        }
    }

    public static class LastPlays {
        private int ctCount;
        private int tCount;
        private int diceCount;

        public LastPlays() {
            ctCount = 46;
            tCount = 46;
            diceCount = 8;
        }

//        public void add(ROLL roll) {
//            if (roll.equals(ROLL.CT))
//                ctCount += 1;
//            if (roll.equals(ROLL.T))
//                tCount += 1;
//            if (roll.equals(ROLL.DICE))
//                diceCount += 1;
//        }

        public void update(ROLL toRemove, ROLL toAdd) {
            if (toRemove.equals(ROLL.CT))
                ctCount -= 1;
            if (toRemove.equals(ROLL.T))
                tCount -= 1;
            if (toRemove.equals(ROLL.DICE))
                diceCount -= 1;

            if (toAdd.equals(ROLL.CT))
                ctCount += 1;
            if (toAdd.equals(ROLL.T))
                tCount += 1;
            if (toAdd.equals(ROLL.DICE))
                diceCount += 1;
        }

        public int getCtCount() {
            return ctCount;
        }

        public int gettCount() {
            return tCount;
        }

        public int getDiceCount() {
            return diceCount;
        }
    }
}
