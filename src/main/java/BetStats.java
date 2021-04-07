import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.File;
import java.io.IOException;
import java.util.*;

public class BetStats {
    private final static String PROJECT_DIR = System.getProperty("user.dir");
    private final static String SEEDS_DIR = PROJECT_DIR + File.separator + "src" + File.separator + "main" + File.separator + "resources" + File.separator + "seeds";
    private static HashMap<String, HashMap<String, List<String>>> map;

    private static long total = 0;
    private static long totalct = 0;
    private static long totalt = 0;
    private static long totaldice = 0;
    private static long maxct = 0;
    private static long maxt = 0;
    private static long maxdice = 0;

    public static void main(String[] args) throws IOException {
        File seedsDir = new File(SEEDS_DIR);
        String[] sortedSeedFiles = seedsDir.list();
        assert sortedSeedFiles != null;
        Arrays.sort(sortedSeedFiles);

        map = new HashMap<>();
        map.put("ct", new HashMap<>());
        map.put("t", new HashMap<>());
        map.put("dice", new HashMap<>());


        ObjectMapper mapper = new ObjectMapper();

        for (int i = 0; i < sortedSeedFiles.length; i++) {
            String rollFile1 = sortedSeedFiles[i];
            File seedFile1 = new File(seedsDir, rollFile1);
            List<String> rolls = mapper.readValue(seedFile1, List.class);

            for (int j = 0; j < rolls.size(); j++) {
                total += 1;

                boolean found = false;

                String roll = rolls.get(j);
                if (roll.equals("t"))
                    totalt += 1;
                if (roll.equals("ct"))
                    totalct += 1;
                if (roll.equals("dice"))
                    totaldice += 1;

                for (int k = j + 1; k < rolls.size(); k++) {
                    String roll2 = rolls.get(k);
                    if (roll.equals(roll2)) {
                        HashMap<String, List<String>> value = map.get(roll);
                        int diff = k - j;
                        List<String> diffCounter = value.get(processKey(String.valueOf(diff)));

                        if (diffCounter == null)
                            diffCounter = new ArrayList<>();

                        diffCounter.add(seedFile1.getName());
                        value.put(processKey(String.valueOf(diff)), diffCounter);

                        updateMax(roll, diff);

                        found = true;
                        break;
                    }
                }
                if (!found) {
                    if (i == sortedSeedFiles.length - 1) {
                        continue;
                    } else {
                        String rollFile2 = sortedSeedFiles[i+1];
                        File seedFile2 = new File(seedsDir, rollFile2);
                        List<String> rolls2 = mapper.readValue(seedFile2, List.class);
                        for (int k = 0; k < rolls2.size(); k++) {
                            String roll2 = rolls2.get(k);
                            if (roll.equals(roll2)) {
                                HashMap<String, List<String>> value = map.get(roll);
                                int diff = rolls.size() - j + k;
                                List<String> diffCounter = value.get(processKey(String.valueOf(diff)));
                                if (diffCounter == null)
                                    diffCounter = new ArrayList<>();

                                diffCounter.add(seedFile1.getName());
                                value.put(processKey(String.valueOf(diff)), diffCounter);

                                updateMax(roll, diff);
                                break;
                            }
                        }
                    }
                }
            }
        }

        printMap();
        printTotals();
    }

    private static void updateMax(String roll, int diff) {
        if (roll.equals("t"))
            if (diff > maxt)
                maxt = diff;
        if (roll.equals("ct"))
            if (diff > maxct)
                maxct = diff;
        if (roll.equals("dice"))
            if (diff > maxdice)
                maxdice = diff;
    }

    private static String processKey(String valueOf) {
        int i = 3 - valueOf.length();
        return "0".repeat(Math.max(0, i)) +
                valueOf;
    }

    private static void printMap() {
        for (String name : map.keySet()) {
            System.out.println(name);
            HashMap<String, List<String>> coinValues = map.get(name);
            List<String> sortedKeys = new ArrayList<>(coinValues.keySet());
            Collections.sort(sortedKeys);
            for (String diff : sortedKeys) {
                System.out.println("" + diff + " -> " + coinValues.get(diff).size() + " " + (coinValues.get(diff).size() < 10 ? coinValues.get(diff) : "") );
            }
        }
    }

    private static void printTotals() {
        System.out.println("");
        System.out.println("Total = " + total);
        System.out.println("Total CT = " + totalct + " (" + ((float)totalct/total) + ")");
        System.out.println("Total T = " + totalt + " (" + ((float)totalt/total) + ")");
        System.out.println("Total DICE = " + totaldice + " (" + ((float)totaldice/total) + ")");
        System.out.println("MAX CT = " + maxct);
        System.out.println("MAX T = " + maxt);
        System.out.println("MAX DICE = " + maxdice);
    }
}
